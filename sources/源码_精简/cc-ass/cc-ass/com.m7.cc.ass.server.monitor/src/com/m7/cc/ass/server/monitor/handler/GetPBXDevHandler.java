package com.m7.cc.ass.server.monitor.handler;

import java.io.BufferedReader;
import java.io.InputStreamReader;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class GetPBXDevHandler {

	public static C5Response getPBXDev(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		
		try {
			String result = excuteCommand("df -h");
			response.addParameter(Fields.Event, result);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setMessage(e.getMessage());
			response.setSucceed(true);
		}
		return response;
	}
	
	private static String excuteCommand(String command) throws Exception {
		Runtime r = Runtime.getRuntime();
		Process p;
		p = r.exec(command);
		BufferedReader br = new BufferedReader(new InputStreamReader(p
				.getInputStream()));
		StringBuffer result = new StringBuffer();
		String inline;
		while ((inline = br.readLine()) != null) {
			result.append(inline + "\n");
		}
		br.close();
		return result.toString();
	}

}
