package com.m7.cc.ass.model;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.model.Binded400;
import com.m7.cc.bill.BillInterfaceRequirer;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ACSStorage;
import com.m7.cc.json.JSONReader;
import com.m7.cc.util.Utils;

public class C5LisenceHandler {
	private static Logger log = Logger.getLogger(C5LisenceHandler.class
			.getName());
	private static String lisenceUrl = null;
	private static JSONReader jsonReader = new JSONReader();

	public static void updateLisence() {
		lisenceUrl = ASConfig.getInstance().getVar("lisence.url");
		if (lisenceUrl == null) {
			log.warning("Lisence url not found in configuration");
			return;
		}
		try {
			// JSONReader reader = new JSONReader();
			Vector<String> pbxs = RuntimeData.getInstance().getPbxs();
			for (int i = 0, len = pbxs.size(); i < len; i++) {
				C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxs.get(i));
				List<String> accounts = pbx.getAccountNameList();
				C5Account account;
				for (int j = 0; j < accounts.size(); j++) {
					account = pbx.getAccount(accounts.get(j));
					if (!updateFee(account))
						continue;
					if (!updateCalls(account))
						continue;
					ACSStorage.updateAccount(account);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "update lisence failed", e);
		}

	}

	public static C5Lisence updateLisence(C5Account account) {
		lisenceUrl = ASConfig.getInstance().getVar("lisence.url");
		if (lisenceUrl == null) {
			log.warning("Lisence url not found in configuration");
			return null;
		}
		try {
			updateFee(account);
			updateCalls(account);
			ACSStorage.updateAccount(account);
			return account.getLisence();
		} catch (Exception e) {
			log.log(Level.WARNING, "update lisence failed", e);
			return null;
		}
	}

	public static void update400Lisence() {
		Set<Entry<String, Binded400>> binded400Set = ASConfig.getInstance()
				.getBinded400Set();
		if (binded400Set.size() > 0) {
			Iterator<Entry<String, Binded400>> it = binded400Set.iterator();
			Binded400 binded400 = null;
			while (it.hasNext()) {
				try {
					binded400 = it.next().getValue();
					update400License(binded400.getAccountId());
				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				}
			}
		}
	}
	
	public static boolean update400License(String accountId) {
		try {
			Object result = BillInterfaceRequirer.require(lisenceUrl
					+ "?action=service.hasFare&data={\"account\":\"" + accountId
					+ "\",\"type\":\"6\"}", 5000);
			if (result != null) {
				Map<String, Object> info = (Map<String, Object>) result;
				if (info.get(Fields.FareOf400) != null) {
					boolean isUpdate400 = false;
					Map<String, String> mapInfo = (Map<String, String>) jsonReader
							.read(info.get(Fields.FareOf400).toString());
					for (String key : mapInfo.keySet()) {
						if (mapInfo.get(key).equals("1")) {
							ASConfig.getInstance().updateBinded400(key,
									mapInfo.get(key));
							isUpdate400 = true;
						} else {
							if (Utils.getDate("d").equals("1")) {
								ASConfig.getInstance().updateBinded400(key,
										mapInfo.get(key));
								isUpdate400 = true;
							}
						}
					}
					if (isUpdate400) {
						ASConfig.getInstance().update400File();
					}
					return true;
				} else {
					log.warning("Parameter [" + Fields.FareOf400
							+ "] not found!");
					return false;
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return false;
	}

	private static boolean updateFee(C5Account account) {
		// {"result":"20000","canUse":"1","remark":"增值业务查询成功"}
		try {
			Object result = BillInterfaceRequirer.require(lisenceUrl
					+ "?action=service.hasFare&data={\"account\":\"" + account.getAccount()
					+ "\",\"type\":\"1\"}", 5000);
			if (result != null) {
				Map<String, Object> info = (Map<String, Object>) result;
				if (info.get(Fields.FareOfCall).toString().equals("1")) {
					account.getLisence().setCanDialout(true);
				} else {
					account.getLisence().setCanDialout(false);
				}
				if (info.get(Fields.FareOf400) != null) {
					boolean isUpdate400 = false;
					Map<String, String> mapInfo = (Map<String, String>) jsonReader
					.read(info.get(Fields.FareOf400).toString());
					for (String key : mapInfo.keySet()){
						if (mapInfo.get(key).equals("1")){
							ASConfig.getInstance().updateBinded400(key, mapInfo.get(key));
							isUpdate400 = true;
						} else {
							if (Utils.getDate("d").equals("1")) {
								ASConfig.getInstance().updateBinded400(key, mapInfo.get(key));
								isUpdate400 = true;
							}
						}
					}
					if(isUpdate400){
						ASConfig.getInstance().update400File();
					}
				}
//				if (info.get(Fields.FareOf400).toString().equals("1")) {
//					account.getLisence().setCallable400(true);
//				} else {
//					if (Utils.getDate("d").equals("1")) {
//						account.getLisence().setCallable400(false);
//					}
//				}
				return true;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return false;
	}

	private static boolean updateCalls(C5Account account) {
		// {"call":"0","result":"20000","app":"0","remark":"查询帐户license数成功"}
		try {
			Object result = BillInterfaceRequirer.require(
					lisenceUrl + "?action=service.queryLicenseCount&data={\"account\":\""
							+ account.getAccount() + "\",\"pbx\":\""
							+ account.getPbx() + "\"}", 5000);
			if (result != null) {
				Map<String, Object> info = (Map<String, Object>) result;

				int count = 0;
				
				if(info.containsKey(Fields.VersionMonitor)){
					count = Integer.valueOf(info.get(Fields.VersionMonitor)
							.toString());
					account.getLisence().setMonitorCount(count);
				}
				
				if(info.containsKey(Fields.VersionEnterprise)){
					count = Integer.valueOf(info.get(Fields.VersionEnterprise)
							.toString());
					account.getLisence().setEnterpriseCount(count);
				}
				
				if(info.containsKey(Fields.VersionOutCall)){
					count = Integer.valueOf(info.get(Fields.VersionOutCall)
							.toString());
					account.getLisence().setOutCallCount(count);
				}
				
				if(info.containsKey(Fields.VersionOutcallSpecial)){
					count = Integer.valueOf(info.get(Fields.VersionOutcallSpecial)
							.toString());
					account.getLisence().setOutCallSpecialCount(count);
				}
				if(info.containsKey(Fields.VersionService)){
					count = Integer.valueOf(info.get(Fields.VersionService)
							.toString());
					account.getLisence().setServiceCount(count);					
				}
				if(info.containsKey(Fields.VersionStandard)){
					count = Integer.valueOf(info.get(Fields.VersionStandard)
							.toString());
					account.getLisence().setStandardCount(count);
				}
				if(info.containsKey(Fields.VersionIVR)){
					count = Integer.valueOf(info.get(Fields.VersionIVR).toString());
					account.getLisence().setIvrCount(count);
				}
				if(info.containsKey(Fields.VersionBusiness)){
					count = Integer.valueOf(info.get(Fields.VersionBusiness)
							.toString());
					account.getLisence().setBusinessCount(count);
				}
				if(info.containsKey(Fields.VersionOrder)){
					count = Integer.valueOf(info.get(Fields.VersionOrder)
							.toString());
					account.getLisence().setOrderCount(count);
				}
				if(info.get(Fields.MaxIncomingCalls) != null){
					account.getLisence().setMaxIncomingCalls(
							Integer.valueOf(info.get(Fields.MaxIncomingCalls)
									.toString()));
				}
				if(info.get(Fields.MaxOutboundCalls) != null){
					account.getLisence().setMaxOutboundCalls(
							Integer.valueOf(info.get(Fields.MaxOutboundCalls)
									.toString()));
				}
				if(info.get(Fields.AutoCallStrategy) != null){
					account.getLisence().setAutoCallStrategy(info.get(Fields.AutoCallStrategy).toString());
				}
				if(info.get(Fields.SmartAutoCallCount) != null){
					account.getLisence().setSmartAutoCallCount(
							Integer.valueOf(info.get(Fields.SmartAutoCallCount)
									.toString()));
				}
				
				return true;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return false;
	}
}
