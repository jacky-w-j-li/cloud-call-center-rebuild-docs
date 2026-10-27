package com.m7.cc.ass.gateway;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.asterisk.ami.AMIField;
import com.m7.cc.asterisk.ami.action.AsteriskEvent;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class NewextenHandler {
	private EventHandler asterisk;

	private static final Logger log = Logger.getLogger(NewextenHandler.class
			.getName());

	public NewextenHandler(EventHandler asterisk) {
		this.asterisk = asterisk;
	}

	/**
	 * Event: Newexten Privilege: call,all Extension: 2000 Application: Queue
	 * Timestamp: 1245168047.680729 Uniqueid: 1244774639.123 Channel:
	 * SIP/6001-09ed0830 Priority: 1 AppData: 2000 Context: g3si
	 */
	public void handleNewexten(AsteriskEvent _event) {
		NewExtenEvent event = new NewExtenEvent();
		event.setValues(_event.getParameters());
		GWChannel channel = asterisk.getChannel(event.getUniqueid());
		if (channel == null) {
			log.warning("Can not find channel for: " + _event.toString());
			return;
		} else {
			event.addParameter(Fields.Account, channel.getAccount());
			event.addParameter(Fields.ChannelType, channel.getChannelType());
			if (event.getPriority().equalsIgnoreCase("1")
					&& !event.getExtension().equalsIgnoreCase("h")) {
				parserContext(event, channel);
				asterisk.notifyChannelPathChanged(event, channel);
			}
			if (event.getApplication().equalsIgnoreCase(AMIField.Set)) {
				processSet(event, channel);
			}
		}
	}

	/**
	 * Normal
	 * 
	 * @param event
	 */
	private void parserContext(NewExtenEvent event, GWChannel channel) {
		try {
			String context = event.getContext();
			if(context.equals("default")){
				String exten = event.getStringValue(Fields.Extension);
				if(exten.matches("[0-9]+")){
					channel.setChannelType(Fields.normal);
				}
			}
				
		} catch (Exception e) {
			log.log(Level.WARNING, "process NewExtenEvent failed", e);
		}
	}

	/**
	 * the Set command is used to set a app field for c5 of a channel
	 * 
	 * @param event
	 */
	private void processSet(NewExtenEvent event, GWChannel channel) {
		try {
			String[] appData = event.getAppData().split("=", 2);
			String key = appData[0];
			String value = appData[1].replaceAll("\"", "");
			if (key.startsWith("__")) {
				channel.addVar(key.substring(2), value);
			} else if (key.equals("FROM_CID")) {
				String result = value;
//				if (Utils.isMobileNo(result)) {
//
//				} else if (result.startsWith("0") && Utils.isMobileNo(result.substring(1))) {
//					result = value.substring(1);
//				} else if (result.startsWith("400")) {
//
//				} else if (result.startsWith("0")) {
//
//				} else if (result.matches("[0-9]+")) {
//					result = ASConfig.getInstance().getDistrictNo() + result;
//				}
				channel.addVar(key, result);
				channel.setFromCid(result);
			} else if (key.equals("FROM_DID")) {
				String result = value;
				if (Utils.isMobileNo(result)) {

				} else if (result.startsWith("0") && Utils.isMobileNo(result.substring(1))) {
					result = value.substring(1);
				} else if (result.startsWith("400")) {

				} else if (result.startsWith("0")) {

				} else if (result.startsWith("17991")){
					result = result.substring(5, result.length());
				} else if (result.startsWith("00")){
					
				}else if (result.matches("[0-9]+")) {
					if (channel.getChannelType().equals(Fields.Dialout))
						result = ASConfig.getInstance().getDistrictNo() + result;
				}
				channel.addVar(key, result);
				channel.setFromDid(result);
			} else if (key.equals("ACCOUNT")) {
				// if this context is service number and the setting
				// variable is
				// account,
				// we notify this ring event
				channel.addVar(key, value);
				channel.setAccount(value);
				asterisk.notifyChannelStatusChanged(channel);
			} else if (key.equalsIgnoreCase("ROUTE")) {
				channel.setRoute(value);
			} else if (key.equalsIgnoreCase("LINE")) {
				channel.setLine(value);
			} else if (key.equalsIgnoreCase("PRODUCT")) {
				channel.setProduct(value);
			} else if (key.equals("CONNECT_TYPE")) {
				if(value.equals("0"))
					channel.setChannelType(Fields.transfer);
				else if(value.equals("1"))
					channel.setChannelType(Fields.dialout);
				else if(value.equals("2"))
					channel.setChannelType(Fields.normal);
			} else if (key.equalsIgnoreCase("AGENT_ID")) {
				channel.setAgentId(value);
			} else if (key.equalsIgnoreCase("CALL_SHEET_ID")) {
				channel.setCall_sheet_ID(value);
			}
			else {
				channel.addVar(key, value);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "process Set failed", e);
		}
	}

	public void close() {
		this.asterisk = null;
	}
}
