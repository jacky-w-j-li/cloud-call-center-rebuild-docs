package com.m7.monitor.sip;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;

import javax.sip.InvalidArgumentException;
import javax.sip.address.Address;
import javax.sip.address.SipURI;
import javax.sip.header.CSeqHeader;
import javax.sip.header.CallIdHeader;
import javax.sip.header.ContactHeader;
import javax.sip.header.FromHeader;
import javax.sip.header.MaxForwardsHeader;
import javax.sip.header.ToHeader;
import javax.sip.header.UserAgentHeader;
import javax.sip.header.ViaHeader;
import javax.sip.message.Request;

import com.m7.util.Utils;

public class MessageMaker {

	/**
	 * 
	 * @param toRUI
	 * @param fromURI
	 * @param callID
	 * @param userAgent
	 * @return
	 * @throws java.text.ParseException
	 * @throws javax.sip.InvalidArgumentException
	 */
	public static Request createRequest(IceSipURI toURI, IceSipURI fromURI,
			String callId, String userAgent, long seqc,
			int maxForwardsNum, String tag, String requestType) throws ParseException,
			InvalidArgumentException {
		// the transport should be udp
		String transport = "udp";
		
		// request
		//When register the toExtension should be null?
		String toExtension = null;
		if(!requestType.equalsIgnoreCase(Request.REGISTER))
			toExtension = toURI.getExtension();
		SipURI _requestURI = C5SipProvider.getInstance().addressFactory
				.createSipURI(toExtension, toURI.getIpAddress());
		_requestURI.setPort(toURI.getPort());

		// via header
		ArrayList viaHeaders = createViaHeaders(fromURI, transport);

		// from and to header
		FromHeader fromHeader = createFromHeader(fromURI, tag);
		ToHeader toHeader = createToheader(toURI);

		// call id header
		CallIdHeader callIdHeader = C5SipProvider.getInstance().headerFactory
				.createCallIdHeader(callId);

		// sequence header
		CSeqHeader cSeqHeader = C5SipProvider.getInstance().headerFactory
				.createCSeqHeader(seqc, requestType);

		// Create a new MaxForwardsHeader
		MaxForwardsHeader maxForwards = C5SipProvider.getInstance().headerFactory
				.createMaxForwardsHeader(maxForwardsNum);
		
		//contact header
		ContactHeader contactHeader = getContactHeader(fromURI);
		
		//allow header
		//TODO asterisk do not support message, what should I do?
//		AllowHeader allowHeader = getAllowHeader();
		
		//user agent
		List list = new ArrayList();
		list.add(userAgent);
		UserAgentHeader userAgentHeader = C5SipProvider.getInstance().headerFactory.createUserAgentHeader(list);
		
		//request
		Request request = C5SipProvider.getInstance().messageFactory
		.createRequest(_requestURI, requestType, callIdHeader, cSeqHeader,
				fromHeader, toHeader, viaHeaders, maxForwards);
		request.addHeader(contactHeader);
//		request.addHeader(allowHeader);
		request.addHeader(userAgentHeader);
		
		return request;
	}

	private static ArrayList createViaHeaders(IceSipURI fromURI, String transport)
			throws ParseException, InvalidArgumentException {
		ArrayList viaHeaders = new ArrayList();
		ViaHeader viaHeader = C5SipProvider.getInstance().headerFactory
				.createViaHeader(fromURI.getIpAddress(), fromURI.getPort(),
						transport, null);
		viaHeader.setBranch("z9hG4bK" + Utils.getRandom32());
		viaHeader.setRPort();
		// add via headers
		viaHeaders.add(viaHeader);
		return viaHeaders;
	}

	private static FromHeader createFromHeader(IceSipURI fromURI, String tag)
			throws ParseException {
		// create >From Header
		SipURI fromAddress = C5SipProvider.getInstance().addressFactory
				.createSipURI(fromURI.getExtension(), fromURI.getIpAddress());
		Address fromNameAddress = C5SipProvider.getInstance().addressFactory
				.createAddress(fromAddress);
		fromNameAddress.setDisplayName(fromURI.getDisplayName());

		FromHeader fromHeader = C5SipProvider.getInstance().headerFactory
				.createFromHeader(fromNameAddress, tag);
		return fromHeader;
	}

	private static ToHeader createToheader(IceSipURI toURI)
			throws ParseException {
		// create To Header
		SipURI toAddress = C5SipProvider.getInstance().addressFactory
				.createSipURI(toURI.getExtension(), toURI.getIpAddress());
		toAddress.setPort(toURI.getPort());
		Address toNameAddress = C5SipProvider.getInstance().addressFactory
				.createAddress(toAddress);
		toNameAddress.setDisplayName(toURI.getDisplayName());
		ToHeader toHeader = C5SipProvider.getInstance().headerFactory
				.createToHeader(toNameAddress, null);
		return toHeader;
	}

	public static ContactHeader getContactHeader(IceSipURI fromURI) throws ParseException {
		SipURI contactURI = C5SipProvider.getInstance().addressFactory
				.createSipURI(fromURI.getExtension(), fromURI.getIpAddress());
		contactURI.setPort(fromURI.getPort());

		Address contactAddress = C5SipProvider.getInstance().addressFactory
				.createAddress(contactURI);

		// Add the contact address.
		contactAddress.setDisplayName(fromURI.getDisplayName());

		// Create contact headers
		ContactHeader contactHeader = C5SipProvider.getInstance().headerFactory
				.createContactHeader(contactAddress);
		return contactHeader;
	}

}
