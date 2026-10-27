package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.util.log.IceLogger;

/**
 * The handler created for say text of money format.
 * It's invoked by class TtsHandler at present,perhaps,
 * we would consummate as real handle next time.
 */
public class SayDigitHandler {
	public static Logger log = IceLogger.getLogger(ASConfig.getInstance()
			.getLogDir(), "tts", "FINE", false);
	public static String convertNumberFormat(String text){
		StringBuffer buffer = new StringBuffer();
		String[] number;
		
		if(text.indexOf(".")>0){
			number = text.split("\\.");
		}else{
			number = new String[]{text};
		}
		
		/*
		 * 格式化整数部分
		 * */
		String integer = number[0];
		if(Long.parseLong(integer)==0){
			buffer.append("0");
		}else{
			String s = integer;
			String r;
			int l;
			
			/*
			 * 每四位的标识
			 * 0:
			 * 1:万
			 * 2:亿
			 */
			String[] prefixArr = {"", "\u4e07","\u4ebf"};
			boolean b;
			
			/*
			 * 每四位数字分为一组格式化数字
			 */
			for(int i=0,len=integer.length();i<len;i+=4){
				l = s.length();
				if(l>4){
					r = s.substring(l-4, l);
					
					b = l>4?true:false;
					
					buffer.insert(0, baseFormatItem(r, b) + prefixArr[i/4]);
					
					s = s.substring(0, l-4);
				}else{
					r = s;
					buffer.insert(0, prefixArr[i/4]);
					buffer.insert(0, baseFormatItem(r, false));
					break;
				}
			}
		}
		
		/*
		 * 格式化小数部分
		 */
		if(number.length>1){
			String decimal = number[1];
			if(Long.parseLong(decimal)!=0){
				//点
				buffer.append("\u70b9");
				
				int len = decimal.length()>2?2:decimal.length();
				for(int i=0;i<len;i++){
					buffer.append(decimal.charAt(i));
				}
			}
		}
		
		return buffer.toString();
	}
	
	private static String baseFormatItem(String text, boolean flag){
		String formated = "";
		text = "0000" + text;
		text = text.substring(text.length() - 4);
		
		/*
		 * 如果数字形如：0100、1000、0000，则不播报最后的0
		 */
		Pattern patter = Pattern.compile("[1-9]0{2,}$");
		Matcher match = patter.matcher(text);
		boolean notSayZore = match.find();
		if(!notSayZore){
			notSayZore = text.equals("0000");
		}
		
		char item = text.charAt(0);
		if(item != '0'){
			//千
			formated += item + "\u5343";
			flag = true;
		}else{
			if(flag){
				formated += item;
			}
			flag = false;
		}
		
		item = text.charAt(1);
		if(item != '0'){
			//百
			formated += item + "\u767e";
			flag = true;
		}else{
			if(flag){
				formated += item;
			}
			flag = false;
		}
		
		item = text.charAt(2);
		if(item != '0'){
			//十
			formated += item + "\u5341";
			flag = true;
		}else{
			if(flag){
				formated += item;
			}
			flag = false;
		}
		
		item = text.charAt(3);
		if(item != '0'){
			formated += item;
		}
		
		//去除最后的"0"字
		if(notSayZore){
			formated = formated.substring(0, formated.length()-1);
		}
		
		log.info("SayDigitHandler.baseFormatItem:"+text+"(regexp:"+notSayZore+")");
		
		return formated;
	}
}
