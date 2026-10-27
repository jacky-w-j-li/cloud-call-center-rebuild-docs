package com.m7.util;

import org.apache.commons.mail.EmailException;
import org.apache.commons.mail.SimpleEmail;


public class MailSend {

	public static String hostname = "smtp.mxhichina.com";

	public static void send(String title, String content) throws EmailException {
		SimpleEmail email = new SimpleEmail();
		email.setHostName(hostname);
		email.setCharset("utf-8");
		String[] mailTos = AsteriskConf.getInstance().getMailTos();
		email.setFrom("chenguang@7moor.com");
		
		if(mailTos != null) {
			for(int i = 0; i < mailTos.length; i++) {
				email.addTo(mailTos[i]);
			}
		}
		email.setAuthentication("chenguang@7moor.com", "jyqc6666");
		email.setSubject(title);
		email.send();
	}
}
