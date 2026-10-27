package com.m7.monitor.sip;

import java.security.MessageDigest;
import java.text.ParseException;

import javax.sip.ClientTransaction;
import javax.sip.InvalidArgumentException;
import javax.sip.SipException;
import javax.sip.header.AuthorizationHeader;
import javax.sip.header.ExpiresHeader;
import javax.sip.header.WWWAuthenticateHeader;
import javax.sip.message.Request;
import javax.sip.message.Response;

import com.m7.util.Utils;

public class RegisterHandler{
	private Registration callAction = null;

	private String callID;

	private String tag;

	private String userName;

	long seqc = 1;

	public ClientTransaction inviteTid;

	private boolean resultNotified = false;

	private final char[] digit = { '0', '1', '2', '3', '4', '5', '6', '7', '8',
			'9', 'a', 'b', 'c', 'd', 'e', 'f' };

	public RegisterHandler() {
	}

	public void processCallAction(Registration action)
			throws ParseException, InvalidArgumentException, SipException {
		callAction = action;
		callID = action.getCallID();
		tag = Utils.getRandom32()+"";
		String _deviceURI = callAction.getFromURI().toString();
		userName = _deviceURI.substring(_deviceURI.indexOf(":") + 1, _deviceURI
				.indexOf("@"));
		Request register = MessageMaker.createRequest(action.getToURI(), action
				.getFromURI(), action.getCallID(), "7moor ass", ++seqc,
				70, tag, Request.REGISTER);
		ExpiresHeader expires = C5SipProvider.getInstance().headerFactory
				.createExpiresHeader(callAction.getExpireTime());
		register.addHeader(expires);

		inviteTid = C5SipProvider.getInstance().sipProvider
				.getNewClientTransaction(register);
		
		inviteTid.sendRequest();
	}

	public Registration getCallAction() {
		return callAction;
	}

	public Request createAuthRegister(Response response) throws Exception {
		Request registerauth = MessageMaker.createRequest(
				callAction.getToURI(), callAction.getFromURI(), callAction
						.getCallID(), "7moor ass", ++seqc,
				70, tag, Request.REGISTER);
		
		ExpiresHeader expires = C5SipProvider.getInstance().headerFactory
				.createExpiresHeader(callAction.getExpireTime());
		registerauth.addHeader(expires);
		String scheme = ((WWWAuthenticateHeader) (response
				.getHeader(WWWAuthenticateHeader.NAME))).getScheme();
		String nonce = ((WWWAuthenticateHeader) (response
				.getHeader(WWWAuthenticateHeader.NAME))).getNonce();
		String realm = ((WWWAuthenticateHeader) (response
				.getHeader(WWWAuthenticateHeader.NAME))).getRealm();
		
		AuthorizationHeader authheader = C5SipProvider
				.getInstance().headerFactory.createAuthorizationHeader(scheme);
		authheader.setRealm(realm);
		authheader.setNonce(nonce);
		authheader.setAlgorithm("MD5");
		authheader.setUsername(userName);
		authheader.setURI(inviteTid.getRequest().getRequestURI());

		String respuestaM = digestResponse(nonce, null, realm);
		authheader.setResponse(respuestaM);

		registerauth.addHeader(authheader);
		return registerauth;
	}

	public String digestResponse(String nonce, String cnonce, String realm) {

		String digest = null;
		String uri = inviteTid.getRequest().getRequestURI().toString();
		String password = callAction.getFromURI().getPassword();

		if (null == nonce)
			return null; // fail
		try {
			// calculate A1
			MessageDigest md = MessageDigest.getInstance("MD5");
			md.update(userName.getBytes());
			md.update(":".getBytes());
			md.update(realm.getBytes());
			md.update(":".getBytes());
			md.update(password.getBytes());
			byte[] d = md.digest();

			byte[] a1 = bytesToHex(d);

			// calculate A2
			md = MessageDigest.getInstance("MD5");
			md.update("REGISTER".getBytes());
			md.update(":".getBytes());
			md.update(uri.getBytes());
			d = md.digest();
			byte[] a2 = bytesToHex(d);

			// calculate response
			md = MessageDigest.getInstance("MD5");
			md.update(a1);
			md.update(":".getBytes());
			md.update(nonce.getBytes());
			if (cnonce != null) {
				md.update(":".getBytes());
				md.update(cnonce.getBytes());
			}
			md.update(":".getBytes());
			md.update(a2);
			d = md.digest();
			byte[] r = bytesToHex(d);
			digest = new String(r);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return digest;
	}

	private byte[] bytesToHex(byte[] bytes) {
		int len = bytes.length, val, hIndex, lIndex, i;
		byte[] hex = new byte[len * 2];

		for (i = 0; i < len; i++) {
			val = (bytes[i] + 256) % 256;
			hIndex = val >> 4;
			lIndex = val & 0xf;
			hex[i * 2 + 0] = (byte) digit[hIndex];
			hex[i * 2 + 1] = (byte) digit[lIndex];
		}
		return hex;
	}

	public String getCallID() {
		return callID;
	}

	public void setCallID(String callID) {
		this.callID = callID;
	}

	public boolean isResultNotified() {
		return resultNotified;
	}

	public void setResultNotified(boolean resultNotified) {
		this.resultNotified = resultNotified;
	}

	public String getTag() {
		return tag;
	}

	public void setTag(String tag) {
		this.tag = tag;
	}

}