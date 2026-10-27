package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.IVR;
import com.m7.cc.ass.model.configuration.IVRKey;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class IvrTemplate {
	public static final String ACCOUNTID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String MUSIC = "_music";
	public static final String IVRKEY = "_ivrkey";
	public static final String KEY = "_key";
	public static final String NEXT_PEER = "_nextPeer";
	public static final String TIMEOUT = "_timeout";
	public static final String RETRY_TIME = "_retry_time";
	public static final String DIAL_EXTEN = "_ivrdialexten"; // Aman zhai.
																// 2010.06.08

	public static String create(C5Account account, IVR ivr) throws IOException {
		String context = "";
		if(ivr == null)
			return context;
		
		context = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_IVR);
		if("".equals(context)){
			context = ASConfig.getInstance().getVmIvr();
		}
		
		context = context.replaceAll(ACCOUNTID, ivr.getAccount());
		context = context.replaceAll(EXTEN, ivr.getExten());
		context = context.replaceAll(TIMEOUT, ivr.getTimeout()+"");
		context = context.replaceAll(RETRY_TIME, ivr.getRetry_time()+"");
		if(ivr.getMusic() != null)
			context = context.replaceAll(MUSIC, ivr.getMusic().getActionString());
		else context = context.replaceAll(MUSIC+";", "");
		String b = "";
		String[] temp = new String[ivr.getIvrKeys().size()];
		String[] tempPeer = new String[ivr.getIvrKeys().size()];
		
		String keyContext = "";
		keyContext = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_IVR_KEY);
		if (keyContext.equals(""))
			keyContext = ASConfig.getInstance().getVmIvrKey();
		for(int i=0; i< ivr.getIvrKeys().size(); i++){
			IVRKey ivrKey = ivr.getIvrKeys().get(i);
			String exten = ivrKey.getToPeer();
			
			ServicePeer toPeer = null;
			if(exten == null){
				toPeer = new TerminateCall();
			} else {
				toPeer = account.getServicePeer(exten);
			}
			
			if(toPeer != null){
				if (-1 != ivrKey.getKey().indexOf("*"))
					temp[i] = NEXT_PEER + "--asterisk";
//				else if ("_[0-9*#]".equals(ivrKey.getKey()))
				else if ("o".equals(ivrKey.getKey()))
					temp[i] = NEXT_PEER + "--otherKeys";
				else
					temp[i] = NEXT_PEER+ivrKey.getKey();
				tempPeer[i] = toPeer.getActionString();
				
				String a = keyContext;
				a = a.replaceAll(KEY, "o".equals(ivrKey.getKey()) ? "_[0-9*#]" : ivrKey.getKey());
				a = a.replaceAll(EXTEN, ivr.getExten());
				a = a.replaceAll(NEXT_PEER, temp[i])+TempFields.UNIX_ENDLINE;
				b += a;
			} else {
//				throw new PeerNotFoundException("Peer "+exten+" not found");
				temp[i] = NEXT_PEER+ivrKey.getKey();
				tempPeer[i] = new TerminateCall().getActionString();
				String a = keyContext;
				a = a.replaceAll(KEY, "o".equals(ivrKey.getKey()) ? "_[0-9*#]" : ivrKey.getKey());
				a = a.replaceAll(EXTEN, ivr.getExten());
				a = a.replaceAll(NEXT_PEER, NEXT_PEER+ivrKey.getKey())+TempFields.UNIX_ENDLINE;
				b += a;
			}
		}
		context = context.replaceAll(IVRKEY, b);

	
		for(int i=0;i<temp.length;i++){
			context = context.replaceAll(temp[i], tempPeer[i]);
		}
		
		// Aman zhai. 2010.06.08
/*
		String tempDialexten = "";
		String dialextenNode = ivr.getDialextenNode();
		if (null != dialextenNode && !"".equals(dialextenNode))
		{
			tempDialexten = "\t_X => \\{\n" 
				+ "\t\tEXTEN_INPUT_NUMS = \\$\\{EXTEN\\};\n" 
				+ "\t\tgoto " + account.getAccount() + "-" + dialextenNode + "-dial-exten, " + "s, loop;\n"
				+"\t\\}\n";
		}
		context = context.replaceAll(DIAL_EXTEN, tempDialexten);
*/
//		context = context.replaceAll(IVRKEY, b);
		// <--
		
		context += "\n";
	
		return context;
	}
}
