package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class IvrValidateNode extends Context implements ServicePeer {
	public static final String NAME = "ivrvalidate";
	private String pbx;
	private boolean update;
	private String account;
	private String param;

	private String validateToPeer;
	
	private String displayName;

	public IvrValidateNode(String pbx, String account, String exten) {
		//修改 context名字，为 “账号-ivrvalidate”,其中的exten去掉了。
		super(account + "-"+ NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "ivrvalidate-" + exten;
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
			result = "goto " + this.getContext() 
						+ ", \\$\\{" + this.getParam() + "\\}, 1";
		else 
			result = "goto " + this.getContext()
						+ ", \\$\\{EXTEN\\}, 1"; 
		
		
		return result;
	}
	
	public String getServicePeerName() {
		String result = "";

		return result;
	}

	public void addValues(HashMap<String, Object> map) {

	}

	public void setValues(HashMap<String, Object> map) {

	}

	public String getValidateToPeer() {
		return validateToPeer;
	}

	public void setValidateToPeer(String validateToPeer) {
		this.validateToPeer = validateToPeer;
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
			this.displayName = "ivrvalidatenode-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}
	
	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.ToPeer, getValidateToPeer());
		event.addParameter(Fields.DialJobNumParam, getParam());

		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}

}
