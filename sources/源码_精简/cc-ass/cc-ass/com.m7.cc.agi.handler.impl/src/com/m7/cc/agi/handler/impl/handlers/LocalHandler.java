package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.agi.handler.impl.Activator;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class LocalHandler {

	public static Logger log = Logger.getLogger(LocalHandler.class.getName());

	public static void processIvrLogin(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String agi_callerid = action.getStringValue(Fields.agi_callerid);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];

			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());
			action.getParameters().clear();

			User c5user = account.getUserViaExten(exten);
			String accountID = account.getAccount();
			if (c5user == null) {
				log.warning("can not found user for [" + exten + "] of " + pbx
						+ " " + accountID);
				session.send("set variable ivrloginsucceed \"501\"");
				session.close();
				return;
			} else if(!c5user.getLocalNumber().endsWith(agi_callerid)){
				log.warning("the exten [" + exten + "] you import is not the user ");
				session.send("set variable ivrloginsucceed \"501\"");
				session.close();
				return;
			}
			C5Action siginAction = new C5Action(Fields.SignIn,
					Utils.getSynActionID("signin"));
			siginAction.addParameter(Fields.PBX, account.getPbx());
			siginAction.addParameter(Fields.Account, account.getAccount());
			siginAction.addParameter(Fields.User, c5user.getId());
			siginAction.addParameter(Fields.ExtenType, Fields.Local);
			siginAction.addParameter(Fields.Number, c5user.getLocalNumber());

			C5Response response = Activator.getHandler().handle(siginAction);
			if (response.isSucceed()) {
				session.send("set variable ivrloginsucceed \"1\"");
			}else if (!(Boolean) response.getParameterValue("isBeyond")){
				session.send("set variable ivrloginsucceed \"500\"");
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			if (session != null) {
				session.close();
			}
		}
	}

	public static void processIvrLogout(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String agi_callerid = action.getStringValue(Fields.agi_callerid);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];
			
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());
			action.getParameters().clear();

			User c5user = account.getUserViaExten(exten);
			String accountID = account.getAccount();
			if (c5user == null) {
				log.warning("can not found user for [" + exten + "] of " + pbx
						+ " " + accountID);
				session.send("set variable ivrlogoutsucceed \"501\"");
				session.close();
				return;
			} else if(!c5user.getLocalNumber().endsWith(agi_callerid)){
				log.warning("the exten [" + exten + "] you import is not the user ");
				session.send("set variable ivrlogoutsucceed \"501\"");
				session.close();
				return;
			}
			
			C5Action sigoutAction = new C5Action(Fields.SignOut,
					Utils.getSynActionID("signout"));
			sigoutAction.addParameter(Fields.PBX, account.getPbx());
			sigoutAction.addParameter(Fields.Account, account.getAccount());
			sigoutAction.addParameter(Fields.User, c5user.getId());

			C5Response res = Activator.getHandler().handle(sigoutAction);
			if (res.isSucceed()) {
				session.send("set variable ivrlogoutsucceed \"1\"");
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			if (session != null) {
				session.close();
			}
		}
	}
}
