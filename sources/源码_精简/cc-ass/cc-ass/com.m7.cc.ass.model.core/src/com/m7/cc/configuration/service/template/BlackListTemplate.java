package com.m7.cc.configuration.service.template;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class BlackListTemplate {
	public static String create(C5Account account, BlackList blackList){
		if (blackList == null)
			return "";
		String content = "context ";
		content = content + blackList.getContext() + " {"
				+ TempFields.UNIX_ENDLINE;
		String mexten = blackList.getMatchedPeer();
		String uexten = blackList.getUnmatchedPeer();
		ServicePeer mpeer = account.getServicePeer(mexten);
		ServicePeer upeer = account.getServicePeer(uexten);

		String mstr = "";
		
		if (mpeer != null)
			mstr = mpeer.getActionString();
		else 
		{
			if ("1".equals(mexten))
				mstr = "goto " + account.getAccount() + "-investigate, s, 1";
			else
				mstr = "goto "+blackList.getAccount()+"-"+blackList.getExten()+"-match-blacklist" + ", 1, 1";
		}
		String a = "a";
		mstr = a.replaceAll(a, mstr);

		String ustr = "";
				
		if (upeer != null)
			ustr = upeer.getActionString();
		else 
		{
			if ("1".equals(mexten))
				ustr = "goto " + account.getAccount() + "-investigate, s, 1;";
			else
				ustr = new TerminateCall().getActionString();
		}
				
		a = "a";
		ustr = a.replaceAll(a, ustr);
		if (blackList.getStyle() == BlackList.list) {
			for (int j = 0; j < blackList.getBlackListNumbers().size(); j++) {
				String number = blackList.getBlackListNumbers().get(j);
//				if(number.startsWith(ASConfig.getInstance().getDistrictNo())){
//					number = number.substring(ASConfig.getInstance().getDistrictNo().length());
//					if(blackList.getBlackListNumbers().contains(number))
//						continue;
//				}
				content += "\t" + number + " => " + mstr + ";"
						+ TempFields.UNIX_ENDLINE;
			}
		} else {
			content += "\t_" + blackList.getExpression() + " => " + mstr + ";"
					+ TempFields.UNIX_ENDLINE;
		}
		content += "\t_. => " + ustr + ";" + TempFields.UNIX_ENDLINE;
		content += "\th => Hangup;" + TempFields.UNIX_ENDLINE;
		content += "}" + TempFields.UNIX_ENDLINE;
		content += "context "+blackList.getAccount()+"-"+blackList.getExten()+"-match-blacklist"+" {" + TempFields.UNIX_ENDLINE;
		content += "\t_. => Hangup;" + TempFields.UNIX_ENDLINE;
		content += "\th => Hangup;" + TempFields.UNIX_ENDLINE;
		content += "}" + TempFields.UNIX_ENDLINE;
		return content;
	}
		public static String newcreate(C5Account account, BlackList blackList){
			if (blackList == null)
				return "";
			String content = "context ";
			content = content + blackList.getContext() + " {"
					+ TempFields.UNIX_ENDLINE;
			String mexten = blackList.getMatchedPeer();
			String uexten = blackList.getUnmatchedPeer();
			ServicePeer mpeer = account.getServicePeer(mexten);
			ServicePeer upeer = account.getServicePeer(uexten);

			String mstr = "";
			
			if (mpeer != null)
				mstr = mpeer.getActionString();
			else 
			{
				if ("1".equals(mexten))
					mstr = "goto " + account.getAccount() + "-investigate, s, 1";
				else
					mstr = "goto "+blackList.getAccount()+"-"+blackList.getExten()+"-match-blacklist" + ", 1, 1";
			}
			String a = "a";
			mstr = a.replaceAll(a, mstr);

			String ustr = "";
					
			if (upeer != null)
				ustr = upeer.getActionString();
			else 
			{
				if ("1".equals(mexten))
					ustr = "goto " + account.getAccount() + "-investigate, s, 1;";
				else
					ustr = new TerminateCall().getActionString();
			}
					
			a = "a";
			ustr = a.replaceAll(a, ustr);
//			if (blackList.getStyle() == BlackList.list) {
//				for (int j = 0; j < blackList.getBlackListNumbers().size(); j++) {
//					String number = blackList.getBlackListNumbers().get(j);
////					if(number.startsWith(ASConfig.getInstance().getDistrictNo())){
////						number = number.substring(ASConfig.getInstance().getDistrictNo().length());
////						if(blackList.getBlackListNumbers().contains(number))
////							continue;
////					}
//					content += "\t" + number + " => " + mstr + ";"
//							+ TempFields.UNIX_ENDLINE;
//				}
//			} else {
//				content += "\t_" + blackList.getExpression() + " => " + mstr + ";"
//						+ TempFields.UNIX_ENDLINE;
//			}
			content += "\t_. => {" +TempFields.UNIX_ENDLINE;
			content += "\t\tAgi(agi://127.0.0.1:7891/agicallinblacknum?pbx=${HOST}&accountid=${ACCOUNT}&extenid="+blackList.getExten()+"&callinnumber=${FROM_CID});"+ TempFields.UNIX_ENDLINE;
			content += "\t\tif(${IS_BLACK_NUM} == 1){" +TempFields.UNIX_ENDLINE;
			content += "\t\t\t " + mstr + ";" + TempFields.UNIX_ENDLINE;
			content += "\t\t}else{"+ TempFields.UNIX_ENDLINE;
			content += "\t\t\t"+ustr+ ";" +TempFields.UNIX_ENDLINE;
			content += "\t\t}"+ TempFields.UNIX_ENDLINE;
			content += "\t}"+ TempFields.UNIX_ENDLINE;
			content += "\th => Hangup;" + TempFields.UNIX_ENDLINE;
			content += "}" + TempFields.UNIX_ENDLINE;
			content += "context "+blackList.getAccount()+"-"+blackList.getExten()+"-match-blacklist"+" {" + TempFields.UNIX_ENDLINE;
			content += "\t_. => Hangup;" + TempFields.UNIX_ENDLINE;
			content += "\th => Hangup;" + TempFields.UNIX_ENDLINE;
			content += "}" + TempFields.UNIX_ENDLINE;
			return content;
		}
	}
