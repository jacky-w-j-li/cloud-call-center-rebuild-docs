package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Room;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class RoomHandler {
	private static Logger log = Logger.getLogger(RoomHandler.class.getName());

	public static C5Response addRoom(C5Action action) {
		C5Response response = new C5Response(action);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					accountID);
			Room room = account.getRooms().get(exten);
			if (room == null)
				room = new Room(pbx, accountID, exten);

			room.setValues(action.getParameters());

			response.setSucceed(RuntimeData.getInstance().addRoom(pbx,
					accountID, room));
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
