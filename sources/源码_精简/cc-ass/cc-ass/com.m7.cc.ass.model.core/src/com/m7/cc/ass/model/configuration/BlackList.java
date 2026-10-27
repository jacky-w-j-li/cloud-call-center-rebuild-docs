package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Vector;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class BlackList extends Context implements ServicePeer {
	public static final String NAME = "blacklist";
	
	//Number to matche expression
	public static final int matche = 0;
	
	//Number which is in the list
	public static final int list = 1;
	
	// List or Expression
	private int style = 1;

	private String pbx;
	private String account;
	private String matchedPeer = "0";
	private String unmatchedPeer = "0";
	
	private String displayName;
	
	/**
	 * Only one of list and expression can be used in one BlackList.
	 * List: a list of phone number that will be filtered.
	 * Expression: a kind of phone number that will be filtered.
	 * 				X: [0-9]
	 * 				n: [1-9]
	 * 				.: [0-9]+
	 * More details of expression can be found in Asterisk hand book.
	 */
	private Vector<String> blackListNumbers = new Vector<String>();
	private String expression = "0X";
	
	public BlackList(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "blacklist-" + exten;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "blacklist-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	public String getMatchedPeer() {
		return matchedPeer;
	}

	public String getUnmatchedPeer() {
		return unmatchedPeer;
	}

	public void setMatchedPeer(String matchedPeer) {
		this.matchedPeer = matchedPeer;
	}

	public void setUnmatchedPeer(String unmatchedPeer) {
		this.unmatchedPeer = unmatchedPeer;
	}

	public int getStyle() {
		return style;
	}

	public void setStyle(int style) {
		this.style = style;
	}

	public String getAccount() {
		return account;
	}

	public Vector<String> getBlackListNumbers() {
		return blackListNumbers;
	}

	public void addBlackList(String number){
		blackListNumbers.add(number);
	}

	public String getExpression() {
		return expression;
	}

	public void setExpression(String expression) {
		this.expression = expression;
	}

	public String getPbx() {
		return pbx;
	}
	
	public void setValue(Hashtable<String, String> data){
		try{
			this.style = Integer.valueOf(data.get(Fields.Style));
			if(data.containsKey(Fields.List)){
				String[] numbers = data.get(Fields.List).split(",");
				for(int i=0; i<numbers.length; i++){
					if(numbers[i].trim().equalsIgnoreCase(""))
						continue;
					blackListNumbers.add(numbers[i]);
				}
			}
			if(data.containsKey(Fields.Expression))
				this.expression = data.get(Fields.Expression);
			if(data.containsKey(Fields.MatchedPeer))
				this.matchedPeer = data.get(Fields.MatchedPeer);
			if(data.containsKey(Fields.UnmatchedPeer))
				this.unmatchedPeer = data.get(Fields.UnmatchedPeer);
		}catch (Exception e){
			
		}
	}

	public String getActionString() {
		return "goto "+ getContext() + ",\\$\\{FROM_CID\\},1";
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

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Style, "" + getStyle());
		if (getBlackListNumbers().size() > 0) {
			String list = "";
			for (int i = 0; i < getBlackListNumbers().size(); i++) {
				String number = getBlackListNumbers().get(i);
				if (number.trim().equalsIgnoreCase(""))
					continue;
				list += number.trim() + ",";
			}
			if (list.endsWith(",")) {
				list = list.substring(0, list.length() - 1);
				event.addParameter(Fields.List, list);
			}
		}
		if (getExpression() != null)
			event.addParameter(Fields.Expression, getExpression());
		if (getMatchedPeer() != null)
			event.addParameter(Fields.MatchedPeer, getMatchedPeer());
		if (getUnmatchedPeer() != null)
			event.addParameter(Fields.UnmatchedPeer, getUnmatchedPeer());
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}
}
