package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.Satisfaction;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

/**
 * 2012-9-12
 * @author chenguang
 *
 */

public class SatisfactionTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	
	public static final String DATA = "_data";
	
	public static final String WELMUSIC = "_welmusic";
	public static final String INVALIDMUSIC = "_invalidmusic";
	public static final String TIMEOUTMUSIC = "_timeoutmusic";
	public static final String BYEMUSIC = "_byemusic";
	public static final String ENDMUSIC = "_endmusic";
	
	public static final String NEXT_PEER = "_nextPeer";
	public static final String EXTEN = "_exten";
	
	public static String create(C5Account account, Satisfaction satisfaction) throws IOException {
		String a = "";
		
		a = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_SATISFACTION);
		
		if(a.equals(""))
			a = ASConfig.getInstance().getVmSatisfaction();
		
		String exten = satisfaction.getToPeer();
		if(exten != null){
			ServicePeer peer = account.getServicePeer(exten);
			if(peer == null)
				a = a.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
			else a = a.replaceAll(NEXT_PEER, peer.getActionString());
		} else {
			a = a.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
		}
		a = a.replaceAll(ACCOUNT_ID, account.getAccount());
		a = a.replaceAll(EXTEN, satisfaction.getExten());
		
		if(satisfaction.getWelmusic() != null)
		{
			satisfaction.getWelmusic().setPlayback(false);
			a = a.replaceAll(WELMUSIC, satisfaction.getWelmusic().getActionString());			
		}
		else a = a.replaceAll(WELMUSIC+";", "BackGround(sound/investigate);");

		if(satisfaction.getInvalidmusic() != null)
			a = a.replaceAll(INVALIDMUSIC, satisfaction.getInvalidmusic().getActionString());
		else a = a.replaceAll(INVALIDMUSIC+";", "BackGround(sound/invalid);");
		
		if(satisfaction.getTimeoutmusic() != null)
			a = a.replaceAll(TIMEOUTMUSIC, satisfaction.getTimeoutmusic().getActionString());
		else a = a.replaceAll(TIMEOUTMUSIC+";", "Playback(sound/timeout);");
		
		if(satisfaction.getByemusic() != null)
			a = a.replaceAll(BYEMUSIC, satisfaction.getByemusic().getActionString());
		else a = a.replaceAll(BYEMUSIC+";", "Playback(sound/bye);");
		
		if(satisfaction.getEndmusic() != null)
			a = a.replaceAll(ENDMUSIC, satisfaction.getEndmusic().getActionString());
		else a = a.replaceAll(ENDMUSIC+";", "Playback(sound/thx);");
		
		if(satisfaction.getData() != null){
			if(!satisfaction.getData().equals("")){
				a = a.replaceAll(DATA, satisfaction.getData());				
			}else{
				a = a.replaceAll(DATA, "KEY_SAT");
			}
		}else a = a.replaceAll(DATA, "KEY_SAT");
		
		a += "\n";
		return a;
	}
}
