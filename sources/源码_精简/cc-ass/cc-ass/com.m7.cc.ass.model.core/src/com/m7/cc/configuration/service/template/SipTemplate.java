package com.m7.cc.configuration.service.template;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.command.Fields;

public class SipTemplate {
	public static String create(SipPeer peer){
		String data = "";
		data += "[" + peer.getExten() + "]" + Fields.END_LINE;
		data += "type="+peer.getType() + Fields.END_LINE;
		data += "nat="+(peer.isNat()?"yes":"no") + Fields.END_LINE;
		data += "canreinvite="+(peer.isCanreinvite()?"yes":"no") + Fields.END_LINE;
		data += "call-limit="+peer.getCall_limit() + Fields.END_LINE;
		if(peer.isLocal())
			data += "qualify=no" + Fields.END_LINE;
		else data += "qualify=yes" + Fields.END_LINE;
		data += "context=" +peer.getContext() + Fields.END_LINE;
		data += "callerid=" +peer.getName() + Fields.END_LINE;
		data += "disallow=all" + Fields.END_LINE;

		if(peer.isLocal()){
			if(ASConfig.getInstance().getSipCodeLocalListAccount() != null &&
					ASConfig.getInstance().getSipCodeLocalListAccount().get(peer.getAccount()) != null &&
					ASConfig.getInstance().getSipCodeLocalListAccount().get(peer.getAccount()).size() > 0){
				for(String code : ASConfig.getInstance().getSipCodeLocalListAccount().get(peer.getAccount())){
					data += "allow=" + code + Fields.END_LINE;				
				}
			}else{
				if(ASConfig.getInstance().getSipCodeLocalList() != null 
						&& ASConfig.getInstance().getSipCodeLocalList().size() > 0){
					for(String code : ASConfig.getInstance().getSipCodeLocalList()){
						data += "allow=" + code + Fields.END_LINE;				
					}
				}else{
					data += "allow=alaw"+Fields.END_LINE;
					data += "allow=g729" + Fields.END_LINE;				
				}				
			}
			data += "host="+ASConfig.getInstance().getDialoutLine()
				+ Fields.END_LINE;
			data += "port="+ASConfig.getInstance().getDialoutPort()
				+ Fields.END_LINE;
			if(peer.getFromuser() != null){
				if(peer.getFromuser().length() > 37){
						int count = peer.getFromuser().length()/37;
						String realFromuser =peer.getFromuser().substring(37*count, peer.getFromuser().length());
						peer.setFromuser(realFromuser);
				}
			}
			if(peer.getUserID() != null && !peer.getUserID().equals("")){
				data += "fromuser=U"+peer.getUserID()+peer.getFromuser()+Fields.END_LINE;				
			}else{
				data += "fromuser="+peer.getFromuser()+Fields.END_LINE;		
			}
			data += "username="+peer.getUsername()+Fields.END_LINE;
			data += "c5local=yes"+Fields.END_LINE;
		} else {
			if (peer.getExtenType().equalsIgnoreCase(Fields.gateway)
					&& peer.getAllow().size() > 0) {
				for (String codes : peer.getAllow()) {
					data += "allow=" + codes + Fields.END_LINE;
				}
			} else {
				if(ASConfig.getInstance().getSipCodeSipListAccount() != null &&
						ASConfig.getInstance().getSipCodeSipListAccount().get(peer.getAccount()) != null &&
						ASConfig.getInstance().getSipCodeSipListAccount().get(peer.getAccount()).size() > 0){
					for(String code : ASConfig.getInstance().getSipCodeSipListAccount().get(peer.getAccount())){
						data += "allow=" + code + Fields.END_LINE;				
					}	
				}else{
					if(ASConfig.getInstance().getSipCodeSipList() != null 
							&& ASConfig.getInstance().getSipCodeSipList().size() > 0){
						for(String code : ASConfig.getInstance().getSipCodeSipList()){
							data += "allow=" + code + Fields.END_LINE;				
						}					
					}else{
						data += "allow=alaw" + Fields.END_LINE;
						data += "allow=g729" + Fields.END_LINE;
						data += "allow=gsm" + Fields.END_LINE;					
					}					
				}
			}
			data += "secret="+peer.getSecret() + Fields.END_LINE;
			data += "host=dynamic" + Fields.END_LINE;
			data += "c5local=no"+Fields.END_LINE;
		}
		if(peer.getLocalNum() != null)
			data += "localnum="+peer.getLocalNum() + Fields.END_LINE;
		data += Fields.ExtenType+"="+peer.getExtenType() + Fields.END_LINE;
		if(peer.getUserID() != null)
			data += "c5user="+peer.getUserID() + Fields.END_LINE;
		return data;
	}
}
