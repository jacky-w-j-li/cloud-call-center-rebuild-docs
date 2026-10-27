package com.m7.cc.ass.server.config.handler;

import com.m7.cc.ass.server.config.handler.core.C5ConfHandler;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class CoreHandler implements C5ConfHandler {

	@Override
	public C5Response handle(C5Action action) {
		String actionName = action.getActionName();
		// configuration
		if (actionName.equals(Fields.AccountAdd)) {
			return AccountHandler.addAccount(action);
		} else if (actionName.equals(Fields.AccountRemove)) {
			return AccountHandler.removeAccount(action);
		} else if (actionName.equals(Fields.AccountActive)) {
			return AccountHandler.activeAccount(action);
		} else if (actionName.equals(Fields.AccountExtenUpdate)) { 
			return AccountHandler.updateExtenAccount(action);
		} else if (actionName.equals(Fields.AccountExtenRemove)) { 
			return AccountHandler.removeExtenAccount(action);
		} else if (actionName.equals(Fields.EventInterfaceAdd)) { 
			return EventInterfaceHandler.addEventInterface(action);
		} else if (actionName.equals(Fields.EventInterfaceRemove)) {
			return EventInterfaceHandler.removeEventInterface(action);
		} else if (actionName.equals(Fields.BlackListAdd)) {
			return BlackListHandler.addBlackList(action);
		} else if (actionName.equals(Fields.BatchAddBlackList)) {
			return BlackListHandler.batchAddBlackList(action);
		}else if (actionName.equals(Fields.IVRAdd)) {
			return IVRHandler.addIvr(action);
		} else if (actionName.equals(Fields.QueueAdd)) {
			return QueueHandler.addQueues(action);
		} else if (actionName.equals(Fields.ServiceNoAdd)) {
			return ServiceNoHandler.addServiceNo(action);
		} else if (actionName.equals(Fields.SipAdd)) {
			return SipHandler.addSipPeers(action);
		} else if (actionName.equals(Fields.TimeConditionAdd)) {
			return TimeConditionHandler.addTimeCondition(action);
		} else if (actionName.equals(Fields.UserAdd)) {
			return UserHandler.addUser(action);
		} else if (actionName.equals(Fields.UserRemove)) {
			return UserHandler.removeUser(action);
		} else if (actionName.equals(Fields.AnnouncementAdd)) {
			return AnnouncementHandler.addAnnouncement(action);
		} else if (actionName.equals(Fields.DialLineAdd)) {
			return AccountHandler.addDialLine(action);
		} else if (actionName.equals(Fields.ValidateAdd)) {
			return ValidationHandler.addValidate(action);
		} else if (actionName.equals(Fields.FileDelete)) {
			return CommonHandler.deleteFile(action);
		} else if (actionName.equals(Fields.HoldMusicRemove)) {
			return HoldMusicHandler.removeHoldMusic(action);
		} else if (actionName.equals(Fields.MusicAdd)) {
			return HoldMusicHandler.addMusic(action);
		} else if (actionName.equals(Fields.SetInvestigateMusic)) {
			return CommonHandler.setInvestigateMusic(action);
		} else if (actionName.equals(Fields.PeerAdd)) {
			return CommonHandler.add(action);
		} else if (actionName.equals(Fields.PeerRemove)) {
			return CommonHandler.remove(action);
		} else if (actionName.equals(Fields.PeerEffect)) {
			return CommonHandler.effect(action);
		} else if (actionName.equals(Fields.Reload)) {
			return CommonHandler.reload(action);
		} else if (actionName.equals(Fields.Ping)) {
			return new C5Response(actionName, action.getActionID(), true);
		} else if (actionName.equals(Fields.DynamicRouteNodeAdd)) {
			return DynamicRouteNodeHandler.addDynamicRouteNode(action);
		} else if (actionName.equals(Fields.AssignmentNodeAdd)) {
			return AssignmentNodeHandler.addAssignmentNode(action);
		} else if (actionName.equals(Fields.DialJobNumNodeAdd)) {
			return DialJobNumNodeHandler.addDialJobNumNode(action);
		} else if (actionName.equals(Fields.IvrValidateNodeAdd)) {
			return IvrValidateNodeHandler.addIvrValidateNode(action);
		} else if (actionName.equalsIgnoreCase(Fields.ToUpdateLisence)){
			return CommonHandler.toUpdateLisence(action);
		} else if (actionName.equalsIgnoreCase("ToUpdate400Lisence")){
			return CommonHandler.toUpdate400Lisence(action);
		} else if (actionName.equalsIgnoreCase(Fields.SipPeerBind)){
			return SipHandler.bindSipPeer(action);
		} else if (actionName.equalsIgnoreCase(Fields.SipPeerUnbind)){
			return SipHandler.unbindSipPeer(action);
		} else if (actionName.equalsIgnoreCase(Fields.AutoCall)){
			return CallHandler.autoDial(action);
		} else if (actionName.equalsIgnoreCase("DownloadRecorderZip")){
			return DownloadHandler.downloadRecorder(action);
		} else if (actionName.equalsIgnoreCase("Notify")){
			return NotifyHandler.notify(action);
		}else if (actionName.equalsIgnoreCase(Fields.AddAutoCallTask)){
			return CallHandler.addAutoCallTask(action);
		}else if (actionName.equalsIgnoreCase(Fields.StartAutoCallTask)){
			return CallHandler.startAutoCallTask(action);
		}else if (actionName.equalsIgnoreCase(Fields.DeleteAutoCallTask)){
			return CallHandler.DeleteAutoCallTask(action);
		}else if (actionName.equalsIgnoreCase(Fields.RedListAdd)){
			return RedListHandler.addRedList(action);
		}else if(actionName.equals(Fields.GetSipStatus)) {	
			return AccountHandler.getSipStatus(action);
		}else if(actionName.equals(Fields.NumCallToManyLimit)){
			return CommonHandler.NumCallToManyLimit(action);
		}else if(actionName.equals(Fields.PlatformBlackNum)){
			return CommonHandler.PlatformBlackNum(action);
		}else if(actionName.equals("Recorderforbidden")){
			return AccountHandler.forbidRecorder(action);
		}

		return new C5Response(actionName, action.getActionID(), "Action ["
				+ actionName + "] not inplemented in current version of ASS",
				false);
	}
}
