package com.m7.cc.ass.gateway.config.model;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Vector;

import com.m7.cc.command.Fields;

public class AssignmentNode extends Context implements ServicePeer {
	public static final String NAME = "assignment";
	
	private Vector<AssignmentItem> items;
	private boolean update;

	private String toPeer = "0";
	
	private String displayName;

	public AssignmentNode(String exten) {
		super(exten + "-" + NAME, exten);
		items = new Vector<AssignmentItem>();
		this.displayName = "assignment-" + exten;
	}
	
	public int addItem(AssignmentItem item)
	{
		int result = 0;
		
		if (null == item)
			return -1;
		
		if (null == this.items)
			this.items = new Vector<AssignmentItem>();
		
		this.items.addElement(item);
		
		return result;
	}

	public String getItemsString()
	{
		String result = "";
		
		if (null == this.items)
			return result;
		
		int i = 0;
		while (i < this.items.size())
		{
			result += this.items.get(i).getItemString();
			i++;
		}
		
		
		return result;
	}
	
	public String constructItemsString()
	{
		String result = "";
		
		if (null == this.items)
			return result;
		
		int i = 0;
		while (i < this.items.size() - 1)
		{
			result += this.items.get(i).constructItemString();
			result += "&";
			i++;
		}
		
		if (i == (this.items.size() - 1))
			result += this.items.get(i).constructItemString();

		
		return result;
	}

	public String getToPeer() {
		return toPeer;
	}

	public void setToPeer(String toPeer) {
		this.toPeer = toPeer;
	}

	public String getActionString() {
		String result = "";
		
		if (null == this.getContext())
			return null;
		else
			result = "goto " + this.getContext() + ",s,1";
		
		return result;
	}
	
	public String getServicePeerName() {
		return NAME;
	}
	
	public void setValue(Hashtable<String, String> data) {				 
		if (data.containsKey(Fields.ToPeer))
			this.setToPeer(data.get(Fields.ToPeer));
		
		if (data.containsKey(Fields.SetVar))
			this.parseStringToItems(data.get(Fields.SetVar));
	}

	public void addValues(HashMap<String, Object> map) {

	}

	public void setValues(HashMap<String, Object> map) {

	}
	
	public boolean isUpdate() {
		return update;
	}



	public void setUpdate(boolean update) {
		this.update = update;
	}
	
	public int parseStringToItems(String str)
	{
		int result = 0;
		
		if (null == str)
			return -1;
		
		if ("".equals(str))
		{
			if (null == items)
				this.items = new Vector<AssignmentItem>();
			else
				this.items.clear();
			
			return 0;
		}

		String[] strItems = str.split("&");

		if (null == strItems)
			return -1;

		int i = 0;
		for (; i < strItems.length; i++) {
			AssignmentItem item = new AssignmentItem();
			if (0 != item.parseStringToItem(strItems[i]))
				return -1;
			this.addItem(item);
		}
		
		return result;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "assignment-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

}
