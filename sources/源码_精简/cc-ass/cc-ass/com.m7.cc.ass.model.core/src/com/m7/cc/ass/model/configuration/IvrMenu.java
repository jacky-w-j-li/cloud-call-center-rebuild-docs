package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

/**
 * 
 * @author chenguang 2013-04-16
 * 
 */
public class IvrMenu extends Context implements ServicePeer {
	public static final String NAME = "ivr-menu";
	private String account;
	private String pbx;
	private String menuType;
	private String menuOutNum;
	
	private String displayName;

	// The next peer after IvrMenu, if it's null the call will
	// be hung up
	private String toPeer = "0";

	public IvrMenu(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "ivrMenu-" + exten;
	}

	public boolean setValues(Hashtable<String, String> map) {
		try {
			this.setToPeer(map.get(Fields.ToPeer));
			if (map.containsKey(Fields.MenuType)) {
				this.setMenuType((String) map.get(Fields.MenuType));
			}
			if (map.containsKey(Fields.MenuOutNum)) {
				this.setMenuOutNum((String) map.get(Fields.MenuOutNum));
			}
		} catch (Exception e) {
			return false;
		}
		return true;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getToPeer() {
		return toPeer;
	}

	public void setToPeer(String toPeer) {
		this.toPeer = toPeer;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getActionString() {
		if(menuType.equalsIgnoreCase(Fields.inner)){
			return "goto " + this.getContext() + ",s,1";			
		}else{
			return "Hangup";
		}
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
	
	public String getMenuType() {
		return menuType;
	}

	public void setMenuType(String menuType) {
		this.menuType = menuType;
	}

	public String getMenuOutNum() {
		return menuOutNum;
	}

	public void setMenuOutNum(String menuOutNum) {
		this.menuOutNum = menuOutNum;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "ivrMenu-"
					+ ((null == this.getExten()) ? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.MenuType, menuType);		
		if (getMenuType() != null)
			event.addParameter(Fields.MenuOutNum, getMenuOutNum());
		if (getToPeer() != null)
			event.addParameter(Fields.ToPeer, getToPeer());
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}
}
