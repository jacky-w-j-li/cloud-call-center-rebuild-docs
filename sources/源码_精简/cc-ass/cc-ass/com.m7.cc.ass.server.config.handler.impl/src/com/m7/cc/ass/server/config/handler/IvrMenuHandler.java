package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class IvrMenuHandler {

	private static Logger log = Logger.getLogger(IvrMenuHandler.class
			.getName());

	public static C5Response addIvrMenu(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String menuType = null;
			String menuOutNum = null;
			
			Vector<IvrMenu> menus = new Vector<IvrMenu>();
			IvrMenu menu = new IvrMenu(pbx, accountID, action.getStringValue(Fields.Exten));
			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					menu.setDisplayName(displayName);
				}
			}
			if (action.getParameters().containsKey(Fields.NextPeer)){
				String toPeer = action.getStringValue(Fields.NextPeer);
				if(toPeer != null)
					menu.setToPeer(toPeer);
			}
			if(action.hasKey(Fields.MenuType)){
				menuType = action.getStringValue(Fields.MenuType);
				if(menuType != null)
					menu.setMenuType(menuType);
			}
			if(action.hasKey(Fields.MenuOutNum)){
				menuOutNum = action.getStringValue(Fields.MenuOutNum);
				if(menuOutNum != null)
					menu.setMenuOutNum(menuOutNum);
			}
			menus.add(menu);
			RuntimeData.getInstance().updateIvrMenu(pbx, accountID, menus);
			
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}

}
