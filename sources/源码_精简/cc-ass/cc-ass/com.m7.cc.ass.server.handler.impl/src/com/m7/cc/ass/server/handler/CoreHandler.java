package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.server.handler.chat.MessageHandler;
import com.m7.cc.ass.server.handler.core.C5Handler;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class CoreHandler implements C5Handler {
	private static Logger log = Logger.getLogger(CoreHandler.class.getName());
	@Override
	public C5Response handle(C5Action action) {
		String actionName = action.getActionName();
		if (actionName.equalsIgnoreCase(Fields.NewMail)){
			return MailHandler.handle(action);
		} else if (actionName.equalsIgnoreCase(Fields.NewWeixin)){
			return MailHandler.handleNewWeixin(action);
		} else if (actionName.equalsIgnoreCase(Fields.AcceptMail)){
			return MailHandler.acceptMail(action);
		} else if (actionName.equalsIgnoreCase(Fields.NewWebchat)){
			return MailHandler.handleNewWebchat(action);
		} else if (actionName.equalsIgnoreCase(Fields.SetMultiChannelReceiveStatus)){
			return MailHandler.handleSetMultiChannelReceiveStatus(action);
		} else if (actionName.equalsIgnoreCase(Fields.Hangup)) {
			return HangupHandler.processHangup(action);
		} else if (actionName.equalsIgnoreCase(Fields.QueuePause)) {
			return QueueActionHandler.processQueuePause(action);
		} else if (actionName.equalsIgnoreCase(Fields.Transfer)) {
			return TransferHandler.processTransfer(action);
		} else if (actionName.equalsIgnoreCase(Fields.CancelTransfer)) {
			return TransferHandler.processCancelTransfer(action);
		} else if (actionName.equalsIgnoreCase(Fields.Originate)) {
			return OriginateHandler.processOriginate(action);
		} else if (actionName.equalsIgnoreCase(Fields.Busy)) {
			return SetBusyHandler.processBusy(action);
		} else if (actionName.equalsIgnoreCase(Fields.Kick)) {
			return KickHandler.processKick(action);
		} else if (actionName.equalsIgnoreCase(Fields.SetExtenType)) {
			return SetExtenTypeHandler.setExtenType(action);
		} else if (actionName.equalsIgnoreCase(Fields.Validate)) {
			return ValidateHandler.processValidate(action);
		} else if (actionName.equalsIgnoreCase(Fields.IvrMenu)) {
			return IvrMenuHandler.processIvrMenu(action);
		} else if (actionName.equalsIgnoreCase("addqueuemember")) {
			return QueueActionHandler.queueAdd(action);
		} else if (actionName.equalsIgnoreCase("removequeuemember")) {
			return QueueActionHandler.queueRemove(action);
		} else if (actionName.equalsIgnoreCase(Fields.SignIn)) {
			return KickHandler.signIn(action);
		} else if (actionName.equalsIgnoreCase(Fields.SignOut)) {
			return KickHandler.signOut(action);
		} else if (actionName.equalsIgnoreCase(Fields.QueryExtenState)) {
			return KickHandler.queryExtenState(action);
		} else if (actionName.equalsIgnoreCase(Fields.Dialout)) {
			return DialoutHandler.handle(action);
		} else if (actionName.equalsIgnoreCase(Fields.HttpTransfer)) {
			return HttpTransferHandler.processTransfer(action);
		} else if (actionName.equalsIgnoreCase(Fields.ThreeWayCall)){
			return ThreeWayCallHandler.handle(action);
		} else if (actionName.equalsIgnoreCase(Fields.Hold)){
			return HoldHandler.hold(action);
		} else if (actionName.equalsIgnoreCase(Fields.MeetmeMute)){
			return MeetmeMuteHandler.mute(action);
		} else if (actionName.equalsIgnoreCase(Fields.MeetmeUnMute)){
			return MeetmeMuteHandler.mute(action);
		} else if (actionName.equalsIgnoreCase(Fields.Unhold)){
			return HoldHandler.unhold(action);
		} else if (actionName.equalsIgnoreCase(Fields.Login)){
			return LoginHandler.processLoginAction(action);
		} else if (actionName.equalsIgnoreCase(Fields.Logoff)){
			return LoginHandler.processLogoff(action);
		} else if (actionName.equalsIgnoreCase(Fields.Message)){
			return MessageHandler.handleMessage(action);
		} else if (actionName.equalsIgnoreCase(Fields.SetVar)){
			return SetVarHandler.processSetVar(action);
		} else if (actionName.equalsIgnoreCase(Fields.Webcall)){
			return WebCallHandler.processWebCall(action);
		} else if (actionName.equalsIgnoreCase(Fields.Check)){
			return CheckHandler.processCheck(action);
		} else if (actionName.equalsIgnoreCase(Fields.Consult)){
			return ConsultHandler.consult(action);
		} else if (actionName.equalsIgnoreCase(Fields.StopConsult)){
			return ConsultHandler.stopConsult(action);
		} else if (actionName.equalsIgnoreCase(Fields.IsBatchDialouting)){
			return BatchDialoutHandler.isBatchDialouting(action);
		} else if (actionName.equalsIgnoreCase(Fields.PreBatchDialout)){
			return BatchDialoutHandler.preBatchDialout(action);
		} else if (actionName.equalsIgnoreCase(Fields.BatchDialoutAppendPhone)){
			return BatchDialoutHandler.appendBatchDialoutPhones(action);
		} else if (actionName.equalsIgnoreCase(Fields.StartBatchDialout)){
			return BatchDialoutHandler.startBatchDialout(action);
		} else if (actionName.equalsIgnoreCase(Fields.PauseBatchDialout)){
			return BatchDialoutHandler.pauseBatchDialout(action);
		} else if (actionName.equalsIgnoreCase(Fields.UnPauseBatchDialout)){
				return BatchDialoutHandler.unPauseBatchDialout(action);
		} else if (actionName.equalsIgnoreCase(Fields.StopBatchDialout)){
			return BatchDialoutHandler.stopBatchDialout(action);
		} else if (actionName.equalsIgnoreCase(Fields.CloseBatchDialout)){
			return BatchDialoutHandler.closeBatchDialout(action);
		} else if (actionName.equalsIgnoreCase(Fields.Ping)){
			return new C5Response(actionName, action.getActionID(), "", true);
		} else if (actionName.equalsIgnoreCase(Fields.SetUCExtenType)){
			return SetExtenTypeHandler.setUCExtenType(action);
		} else if (actionName.equalsIgnoreCase(Fields.GetUCExtenType)){
			return SetExtenTypeHandler.getUCExtenType(action);
		} else if (actionName.equalsIgnoreCase(Fields.GetConference)){
			return ConferenceHandler.GetConference(action);
		} else if (actionName.equalsIgnoreCase(Fields.JoinConference)){
			return ConferenceHandler.JoinConference(action);
		} else if (actionName.equalsIgnoreCase(Fields.ListenConference)){
			return ConferenceHandler.ListenConference(action);
		} else if (actionName.equalsIgnoreCase(Fields.UnlistenConference)){
			return ConferenceHandler.UnListenConference(action);
		} else if (actionName.equalsIgnoreCase(Fields.InviteToConference)){
			return ConferenceHandler.inviteToConference(action);
		} else if (actionName.equalsIgnoreCase(Fields.ChatingIvrPlay)) {
			return ChatingIvrPlayHandler.processChatingIvrPlay(action);
		}else {
			log.log(Level.WARNING, "Action not supported: "+action.getJsonString());
		}
	
		return new C5Response(actionName, action.getActionID(), "Action ["+
				actionName+"] not inplemented in current version of ASS", false);
	}
}
