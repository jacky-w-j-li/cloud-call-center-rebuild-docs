package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.model.CallNumberInfo;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class CallNumberInfoHandler {
	public static Logger log = Logger.getLogger(CallNumberInfoHandler.class
			.getName());

	public static void getNumberDistrictNo(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String calleeNumber = a[0].split("=")[1];

			if (calleeNumber.equals("")) {
				session.send("set variable phoneDistrictNo \"404\"");
				session.close();
				return;
			}

			if (calleeNumber.startsWith("0")) {
				if (Utils.isMobileNo(calleeNumber.substring(1))) {
					calleeNumber = calleeNumber.substring(1);
				}
			} else {
				if (!Utils.isMobileNo(calleeNumber)) {
					session.send("set variable phoneDistrictNo \""
							+ ASConfig.getInstance().getDistrictNo() + "\"");
					session.close();
					return;
				}
			}

			CallNumberInfo numberInfo = ASConfig.getInstance()
					.getNumberInfoViaNumber(calleeNumber);
			if (numberInfo == null) {
				session.send("set variable phoneDistrictNo \"404\"");
				session.close();
				return;
			}
			session.send("set variable phoneDistrictNo \""
					+ numberInfo.getDistrictNo() + "\"");
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}

	public static void getNumberProvince(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String calleeNumber = a[0].split("=")[1];

			if (calleeNumber.equals("")) {
				session.send("set variable phoneProvince \"404\"");
				session.close();
				return;
			}

			if (calleeNumber.startsWith("0")) {
				if (Utils.isMobileNo(calleeNumber.substring(1))) {
					calleeNumber = calleeNumber.substring(1);
				}
			} else {
				if (!Utils.isMobileNo(calleeNumber)) {
					calleeNumber = ASConfig.getInstance().getDistrictNo()
							+ calleeNumber;
				}
			}

			CallNumberInfo numberInfo = ASConfig.getInstance()
					.getNumberInfoViaNumber(calleeNumber);
			if (numberInfo == null) {
				session.send("set variable phoneProvince \"404\"");
				session.close();
				return;
			}
			session.send("set variable phoneProvince \""
					+ Utils.unicodeToGB(numberInfo.getProvince()) + "\"");
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
}
