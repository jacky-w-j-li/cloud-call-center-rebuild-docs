package com.m7.cc.agi.handler.impl.handlers;

import java.security.MessageDigest;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.EncryptMD5;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class EncryptMD5Handler {
	public static Logger log = IceLogger.getLogger(ASConfig.getInstance()
			.getLogDir(), "md5", "FINE", false);
	
	/**
	 * 32 bite, low case
	 * @param action
	 */
	public static void handle(C5Action action) {
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			try {
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");
				String pbx = a[0].split("=")[1];
				String servicePeerExten = a[1].split("=")[1];
				String channelName = action.getStringValue(Fields.agi_channel);
				C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
						.getChannel(channelName);
				if (channel == null) {
					log.warning("Channel [" + channelName + "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}

				C5Account account = RuntimeData.getInstance().getAccount(pbx,
						channel.getAccount());
				if (account == null) {
					log.warning("Account [" + channel.getAccount()
							+ "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}

				EncryptMD5 encryptMD5 = account.getEncryptMD5s().get(servicePeerExten);
				if (encryptMD5 == null) {
					log.warning("EncryptMD5 [" + servicePeerExten + "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}

				action.getParameters().clear();

				try {
					String result = "";
					String encryptText = encryptMD5.getEncryptText();
					if (encryptText != null && !encryptText.equals("")) {
						if (encryptText.startsWith("__")) {
							encryptText = channel.getVar(encryptText.substring(2));
						}
						if (encryptText != null && !encryptText.equals("")) {
							MessageDigest md = MessageDigest.getInstance("MD5");
							md.update((encryptText).getBytes("UTF-8"));
							byte[] paramDigest = md.digest();
							result = Utils.byteArrayToHexString(paramDigest);
							log.info("[" + channel.getAccount() + "]Encrypt " + encryptText + " to MD5: " + result);
						}
					}
					String value = result.replaceAll(" ", "");
					session.send("set variable " + encryptMD5.getVar() + " \""
							+ value+"\"");
					if (encryptMD5.getVar().startsWith("__")) {
						channel.addC5Var(encryptMD5.getVar(), value);
					}
					channel.addVar(encryptMD5.getVar(), value);
				} catch (Exception e) {
					log.log(Level.WARNING, "Encrypt MD5 failed: ["
							+ channel.getAccount()+"]"+encryptMD5.getVar(), e);
				}
				action.getParameters().clear();
				session.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
				action.getParameters().clear();
				session.close();
				return;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}
}
