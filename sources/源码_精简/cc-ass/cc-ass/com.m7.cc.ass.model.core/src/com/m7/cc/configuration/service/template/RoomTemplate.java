package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.Room;

public class RoomTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String ROOM_NUMBER = "_roomNumber";
	public static final String ROOM_PASSWORD = "_roomPassword";
	
	public static String create(C5Account account, Room room) throws IOException{
		String data = "";
		
		if(room == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(),
				ASConfig.VM_ROOM);
		if (data.equals(""))
			data = ASConfig.getInstance().getVMRoom();
		
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());
		data = data.replaceAll(EXTEN, room.getExten());
		data = data.replaceAll(ROOM_NUMBER, room.getAccount()+room.getExten());
		String roomPassword = "";
		if(room.getPassword() != null && !room.getPassword().equals("")){
			roomPassword = "loop:\n\t\tRead(roomPassword,sound/enterconfpassword,,,3,15);\n\t\tif(\"\\${roomPassword}\"!=\""+
							room.getPassword()+"\"){\n\t\t\tPlayback(sound/confpasswordfail);\n\t\t\tgoto loop;\n\t\t}";
		}
		data = data.replaceAll(ROOM_PASSWORD, roomPassword);
		data += TempFields.UNIX_ENDLINE;
		return data;
	}
}
