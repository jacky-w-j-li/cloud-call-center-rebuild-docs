package com.m7.cc.configuration.service.template;

import java.io.FileNotFoundException;
import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class DialoutTemplate {

	public static final String accountId = "_accountId";
	public static final String setExten = "_setExten";
	public static final String didNum = "_didNum";
	public static final String dialout = "_dialout";
	public static final String districtNo = "_districtNo";
	public static final String prefix = "_prefix";
	public static final String dnLength = "_dnLength";
	public static final String outboundBlackList = "_outboundBlackList";

	/**
	 * 
	 * @param account
	 * @return
	 * @throws FileNotFoundException
	 */
	public static String create(C5Account account, DialLine line)
			throws IOException {
		String data = "";
			
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_DIALOUT);
		if("".equals(data))
			data = ASConfig.getInstance().getVmDialout();
		
		if (line == null) {
			data = data.replaceAll(accountId, account.getAccount());
			data = data.replaceAll(districtNo, ASConfig.getInstance().getDistrictNo(account.getAccount()));
			data = data.replaceAll(didNum, "none");
			data = data.replaceAll(dialout, new TerminateCall()
					.getActionString());
			data = data.replaceAll(dnLength, "0");
			data = data.replaceAll(outboundBlackList, ""); 
		} else {
			String dn = line.getDidNum();
			if (line.isNeedPrefix()) {
				data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_DIALOUT_263);
				if(data.equals(""))
					data = ASConfig.getInstance().getVmDialout263();
				 
				if (dn.charAt(0) != '0' && !dn.startsWith("400") && !dn.startsWith("800") && !Utils.isMobileNo(dn)){
					dn = ASConfig.getInstance().getDistrictNo(account.getAccount()) + dn;
				}
			}
			String ip = ASConfig.getInstance().getDialoutLine();
			String port = ASConfig.getInstance().getDialoutPort();
			if (port != null && !port.trim().equals(""))
				ip = ip + ":" + port;
			String dial = "goto dialout-gateway, " + account.getAccount() + Fields.DialoutFlag + line.getExten() + "\\$\\{EXTEN\\}, 1";
			String outboundB = "Agi(agi://127.0.0.1:7891/AgiIsOutboundBlackList?pbx=\\$\\{HOST\\}&account=\\$\\{ACCOUNT\\}&calledNo=\\$\\{EXTEN\\});";
			data = data.replaceAll(accountId, account.getAccount());
			data = data.replaceAll(districtNo, ASConfig.getInstance().getDistrictNo(account.getAccount()));
			data = data.replaceAll(didNum, dn);
			data = data.replaceAll(dialout, dial);
			data = data.replaceAll(dnLength, ASConfig.getInstance().getDistrictNo(account.getAccount()).length() + "");
			if(account.hasNum(Fields.DialoutBlackList)){
				data = data.replaceAll(outboundBlackList, outboundB);
			}else{
				data = data.replaceAll(outboundBlackList, "");
			}
		}

		return data;
	}
}
