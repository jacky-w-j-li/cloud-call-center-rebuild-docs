package com.m7.cc.configuration.service.template;

import java.io.File;
import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;

public class ExtensionsTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String investigateMusic = "_investigateMusic";
	
	public static String create(String pbx, C5Account account) throws IOException{
		String data = "";
		
		if(account == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_EXTENSIONS);
		if(data.equals(""))
			data = ASConfig.getInstance().getVmExtensions();
			
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());

		String file = account.getInvestigateMusic();
		if (null != file 
				&& (new File(file)).exists()) {		
			int a = file.lastIndexOf('.');
			if(a != -1){
				file = file.substring(0, a);
			}
			data = data.replaceAll(investigateMusic, "BackGround("+file+")");
		} 
		else
			data = data.replaceAll(investigateMusic, "BackGround(sound/investigate)");
		
		return data;
	}
}
