package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.AllBlackNums;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Announcement;
import com.m7.cc.ass.model.configuration.AssignmentNode;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.ass.model.configuration.DialextenNode;
import com.m7.cc.ass.model.configuration.DynamicRouteNode;
import com.m7.cc.ass.model.configuration.ExtensionPeer;
import com.m7.cc.ass.model.configuration.IVR;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.ass.model.configuration.Satisfaction;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.SuperDialJobNum;
import com.m7.cc.ass.model.configuration.TimeCondition;
import com.m7.cc.ass.model.configuration.Validation;
import com.m7.cc.ass.model.configuration.Voicemail;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.json.JSONWriter;

public class CommonHandler {

	private static Logger log = Logger.getLogger(CommonHandler.class.getName());

	public static C5Response add(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String name = action.getStringValue(Fields.Peer);
			if (name.equals(ExtensionPeer.NAME)) {
				return ExtensionPeerHandler.addExtensionPeer(action);
			} else if (name.equals(Voicemail.NAME)) {
				return VoicemailHandler.addVoicemail(action);
			} else if (name.equals(Fields.callurl)){
				return CallUrlHandler.add(action);
			} else if (name.equals(Fields.twowaycall)){
				return TwowayCallHandler.add(action);
			} else if (name.equals(Fields.User)){
				return UserHandler.addUser(action);
			} else if (name.equals(Fields.Queue)){
				return QueueHandler.addQueues(action);
			} else if (name.equals(Fields.TextAnnouncement)){
				return TextAnnouncementHandler.addTextAnnouncement(action);
			} else if (name.equals(Fields.EncryptMD5)){
				return EncryptMD5Handler.addEncryptMD5(action);
			} else if (name.equals(Fields.Room)){
				return RoomHandler.addRoom(action);
			} else if (name.equals(Fields.Satisfaction)){
				return SatisfactionHandler.addSatisfaction(action);
			} else if (name.equals(Fields.NumManage)){
				return NumManageHandler.addNum(action);
			} else if (name.equals(Fields.BatchNumManage)){
				return NumManageHandler.batchaddNum(action);
			} else if (name.equals(Fields.IvrMenu)){
				return IvrMenuHandler.addIvrMenu(action);
			} else if (name.equals(Fields.SuperDialJobNum)){
				return SuperDialJobNumHandler.addSuperDialJobNum(action);
			} else if(name.equals(Fields.MailQueue)){
				return MailQueueHandler.addMailQueues(action);
			} else if(name.equals(Fields.MailAddr)){
				return MailAddrHandler.addMailAddr(action);
			} else if(name.equals(Fields.WeixinAddr)){
				return WeixinAddrHandler.addWeixinAddr(action);
			} else if(name.equals(Fields.WebchatAddr)){
				return WebchatAddrHandler.addWebchatAddr(action);
			}else {
				response.setSucceed(false);
				response.setMessage("Unknow Peer: " + name);
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response remove(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String exten = action.getStringValue(Fields.Exten);
			String[] _extens = exten.split(",");
			Vector<String> extens = new Vector<String>();
			for (int i = 0; i < _extens.length; i++) {
				extens.add(_extens[i]);
			}
			String name = action.getStringValue(Fields.Peer);
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			if(account == null) {
				response.setMessage("Account ["+accountID+"] not found");
				response.setSucceed(false);
				return response;
			}
			if (name.equals(BlackList.NAME)) {
				RuntimeData.getInstance().removeBlacklist(pbx, accountID, extens);
			}

			else if (name.equals(IVR.NAME)) {
				RuntimeData.getInstance().removeIVR(pbx, accountID, extens);
			}

			else if (name.equals(ServiceNo.NAME)) {
				RuntimeData.getInstance().removeServiceNo(pbx, accountID, extens);
			}
			else if (name.equals(DialextenNode.NAME)) {
				RuntimeData.getInstance().removeDialextenNodes(pbx, accountID,
						extens);
			}
			else if (name.equals(DynamicRouteNode.NAME)) {
				RuntimeData.getInstance().removeDynamicRouteNodes(pbx, accountID,
						extens);
			}
			else if (name.equals(AssignmentNode.NAME)) {
				RuntimeData.getInstance().removeAssignmentNodes(pbx, accountID,
						extens);
			}
			
			else if (name.equals(DialJobNumNode.NAME)) {
				RuntimeData.getInstance().removeDialJobNumNodes(pbx, accountID,
						extens);
			}
			else if (name.equals(SipPeer.NAME)) {
				RuntimeData.getInstance().removePeer(pbx, accountID, extens);
			}
			else if (name.equals(C5Queue.NAME)) {
				RuntimeData.getInstance().removeQueue(pbx, accountID, extens);
			}

			else if (name.equals(TimeCondition.NAME)) {
				RuntimeData.getInstance().removeTimeCondition(pbx, accountID,
						extens);
			}

			else if (name.equals(Announcement.NAME)) {
				RuntimeData.getInstance().removeAnnouncement(pbx, accountID,
						extens);
			}
			
			else if (name.equals(Satisfaction.NAME)) {
				RuntimeData.getInstance().removeSatisfaction(pbx, accountID,
						extens);
			}
			else if (name.equals(SuperDialJobNum.NAME)) {
				RuntimeData.getInstance().removeSuperDialJobNum(pbx, accountID,
						extens);
			}
			else if (name.equals(Validation.NAME)) {
				RuntimeData.getInstance().removeValidate(pbx, accountID, extens);
			}
			
			else if (name.equals(IvrMenu.NAME)) {
				RuntimeData.getInstance().removeIvrMenu(pbx, accountID, extens);
			}

			else if (name.equals(Voicemail.NAME)) {
				RuntimeData.getInstance().removeVoicemail(pbx, accountID, extens);
			} else if (name.equals(ExtensionPeer.NAME)) {
				RuntimeData.getInstance().removeExtensionPeer(pbx, accountID,
						extens);
			} else if (name.equals(Fields.callurl)) {
				account.removeCallUrl(exten);
			} else if (name.equals(Fields.twowaycall)) {
				account.removeTwowayCall(exten);
			} else if (name.equals(Fields.TextAnnouncement)) {
				account.removeTextAnnouncement(extens);
			} else if (name.equals(Fields.EncryptMD5)) {
				account.removeEncryptMD5(extens);
			} else if (name.equals(Fields.Room)) {
				account.removeRoom(extens);
			} else if (name.equals(Fields.DialoutBlackList)){
				RuntimeData.getInstance().removeNum(pbx, accountID, extens, Fields.DialoutBlackList);
			} else if (name.equals(Fields.MailAddr)){
				RuntimeData.getInstance().removeMailAddr(pbx, accountID, extens);
			} else if (name.equals(Fields.MailQueue)){
				MailQueueHandler.removeMailQueue(pbx, accountID, extens);
			} else if (name.equals(Fields.WeixinAddr)){
				RuntimeData.getInstance().removeWeixinAddr(pbx, accountID, extens);
			} else if (name.equals(Fields.WebchatAddr)){
				RuntimeData.getInstance().removeWebchatAddr(pbx, accountID, extens);
			}else {
				response.setSucceed(false);
				response.setMessage("Unknow Peer: " + name);
				return response;
			}

			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, action.getJsonString(), e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response effect(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {

			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String name = null;
			if (action.hasKey(Fields.Peer))
				name = action.getStringValue(Fields.Peer);
			if (name == null) {
				RuntimeData.getInstance().effectAll(pbx, account);
			} else {
				RuntimeData.getInstance().effectPeer(pbx, account, name);
			}
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, action.getJsonString(), e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response reload(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			int reloadType = action.getIntValue(Fields.Type);
			switch (reloadType) {
			case Fields.AEL:
				RuntimeData.getInstance().getPbxViaId(pbx).reloadAel();
				break;
			case Fields.ALL:
				RuntimeData.getInstance().getPbxViaId(pbx).reload();
				break;
			case Fields.SIP:
				RuntimeData.getInstance().getPbxViaId(pbx).reloadSip();
				break;
			case Fields.QUEUE:
				RuntimeData.getInstance().getPbxViaId(pbx).reloadQueue();
				break;
			default:
				;
			}
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response deleteFile(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String filename = action.getStringValue(Fields.Filename);
			String path = "";
			if (action.hasKey(Fields.Path)) {
				path = action.getStringValue(Fields.Path) + "/";
			}
			File file = new File(ASConfig.getInstance().getConfigPath() + "/"
					+ pbx + "/accounts/" + account + "/" + path + filename);
			if (file.exists()) {
				file.delete();
				response.setSucceed(true);
			} else {
				response.setSucceed(false);
				response.setMessage("File not found");
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response setInvestigateMusic(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String musicFile = action.getStringValue(Fields.Filename);

			String file = null;

			if ("".equals(musicFile)) {
//				file = null;
			} else {

				file = ASConfig.getInstance().getConfigPath() + "/"
						+ pbx + "/accounts/" + account + "/"
						+ ASConfig.AudioDirectory + "/" + musicFile;

				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
			}
			RuntimeData.getInstance().setInvestigateMusic(pbx, account, file);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	public static C5Response toUpdateLisence(C5Action action){
		return BillRequestHandler.handle(action);
	}

	public static C5Response toUpdate400Lisence(C5Action action) {
		return BillRequestHandler.handle(action);
	}
	
	public static C5Response NumCallToManyLimit(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try {
			if(action.hasKey("accounts")){
				JSONReader jr = new JSONReader();
				ArrayList<HashMap<String, String>>  listmap =(ArrayList<HashMap<String, String>>) action.getParameterValue("accounts");
				HashMap<String, String> map = new HashMap<String,String>();
				for (int i = 0; i < listmap.size(); i++) {
					map.put(listmap.get(i).get("account"), listmap.get(i).get("on-off"));
				}
					RuntimeData.getInstance().getNumCallToManyACCLimit().put(action.getStringValue(Fields.CallNumber), map);
			}else{
				String open = action.getStringValue("on-off");
				RuntimeData.getInstance().getNumCallToManyLimit().put(action.getStringValue(Fields.CallNumber), open);
			}
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	public static C5Response PlatformBlackNum(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		String nums;
		try {
			nums = action.getStringValue("allblacklistnumber");
			AllBlackNums.saveAllBlackNums(nums);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
}
