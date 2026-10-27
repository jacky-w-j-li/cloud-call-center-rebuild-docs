package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class DialJobNumNode extends Context implements ServicePeer {
	public static final String NAME = "dialjobnum";
	private String pbx;
	private boolean update;
	private String account;
	private String param;

	private String toPeerNotExist = "0";
	private String toPeerAgentBusy = "0";
	private String toPeerLogoff = "0";
	
	private String displayName;

	public DialJobNumNode(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "dialjobnumnode-" + exten;
	}

	private boolean isRightParam() {
		boolean result = true;

		if (null == this.param || "".equals(param))
			return false;

		int i = 0;
		while (i < this.param.length()) {
			char c = this.param.charAt(i);
			if ((!Character.isLetterOrDigit(c) && '_' != c)
					|| Character.isWhitespace(c)) {
				result = false;
				break;
			}
			i++;
		}

		return result;
	}

	public String getActionString()
	{
		String result = "";
		
		if (this.isRightParam())
			result = "goto " + this.getAccount() + "-dialin" 
						+ ", \\$\\{" + this.getParam() + "\\}, 1";
		else 
			result = "goto " + this.getAccount() + "-dialin"
						+ ", \\$\\{FROM_DID\\}, 1"; 
		
		
		return result;
	}		
	
	public String getServicePeerName() {
		String result = "";

		return result;
	}
	
	public void setValue(Hashtable<String, String> data) {				 
		if (data.containsKey(Fields.ToPeer))
			this.setToPeerNotExist(data.get(Fields.ToPeer));
		
		if (data.containsKey(Fields.DialJobNumParam))
			this.setParam(data.get(Fields.DialJobNumParam));

		if (data.containsKey(Fields.AgentBusyToPeer))
			this.setToPeerAgentBusy(data.get(Fields.AgentBusyToPeer));
		
		if (data.containsKey(Fields.LogoffToPeer))
			this.setToPeerLogoff(data.get(Fields.LogoffToPeer));
	}

	public void addValues(HashMap<String, Object> map) {

	}

	public void setValues(HashMap<String, Object> map) {

	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public boolean isUpdate() {
		return update;
	}

	public void setUpdate(boolean update) {
		this.update = update;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getToPeerNotExist() {
		return toPeerNotExist;
	}

	public void setToPeerNotExist(String toPeerNotExist) {
		this.toPeerNotExist = toPeerNotExist;
	}
	
	public String getToPeerAgentBusy() {
		return toPeerAgentBusy;
	}

	public void setToPeerAgentBusy(String toPeerAgentBusy) {
		this.toPeerAgentBusy = toPeerAgentBusy;
	}

	public String getToPeerLogoff() {
		return toPeerLogoff;
	}

	public void setToPeerLogoff(String toPeerLogoff) {
		this.toPeerLogoff = toPeerLogoff;
	}

	public String getParam() {
		return param;
	}

	public void setParam(String param) {
		this.param = param;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "dialjobnumnode-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.ToPeer, getToPeerNotExist());
		event.addParameter(Fields.AgentBusyToPeer, getToPeerAgentBusy());
		event.addParameter(Fields.LogoffToPeer, getToPeerLogoff());
		event.addParameter(Fields.DialJobNumParam, getParam());

		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}

}
