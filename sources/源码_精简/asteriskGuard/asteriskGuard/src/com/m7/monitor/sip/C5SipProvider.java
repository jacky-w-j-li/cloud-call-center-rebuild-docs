package com.m7.monitor.sip;

import java.text.ParseException;
import java.util.Hashtable;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.sip.ClientTransaction;
import javax.sip.DialogTerminatedEvent;
import javax.sip.IOExceptionEvent;
import javax.sip.InvalidArgumentException;
import javax.sip.ListeningPoint;
import javax.sip.RequestEvent;
import javax.sip.ResponseEvent;
import javax.sip.ServerTransaction;
import javax.sip.SipException;
import javax.sip.SipFactory;
import javax.sip.SipListener;
import javax.sip.SipProvider;
import javax.sip.SipStack;
import javax.sip.TimeoutEvent;
import javax.sip.TransactionTerminatedEvent;
import javax.sip.address.Address;
import javax.sip.address.AddressFactory;
import javax.sip.header.CallIdHeader;
import javax.sip.header.ContactHeader;
import javax.sip.header.HeaderFactory;
import javax.sip.message.MessageFactory;
import javax.sip.message.Request;
import javax.sip.message.Response;

import com.m7.monitor.Monitor;

/**
 * 
 * @author Caif
 * @version 1.0, 2008-1-4
 */
public class C5SipProvider implements SipListener {

	public static Logger logger = Logger
			.getLogger(C5SipProvider.class.getPackage().getName());

	private static C5SipProvider instance = null;

	public SipProvider sipProvider;

	public ListeningPoint udpListeningPoint;

	public AddressFactory addressFactory;

	public MessageFactory messageFactory;

	public HeaderFactory headerFactory;

	public static final String transportUDP = "udp";

	public static final String transportTCP = "tcp";

	public SipStack sipStack;
	
	private Hashtable<String, RegisterHandler> registers = new Hashtable<String, RegisterHandler>();
	private Hashtable<String, String> results = new Hashtable<String, String>();

	public static C5SipProvider getInstance() {
		if (instance == null) {
			instance = new C5SipProvider();
		}
		return instance;
	}

	private C5SipProvider() {
	}

	/**
	 * 
	 * @param host
	 *            host IP address
	 * @param port
	 *            port for stack to listener.
	 * @param transport
	 * @return
	 */
	public synchronized boolean initStack(String host, int port,
			String transport) {
		if (sipStack != null)
			return true;

		// init the stack
		try {

			SipFactory sipFactory = null;
			sipStack = null;
			sipFactory = SipFactory.getInstance();
			sipFactory.setPathName("gov.nist");
			Properties properties = new Properties();
			properties.setProperty("javax.sip.STACK_NAME", "Softphone");

			properties.setProperty("javax.sip.IP_ADDRESS", host);
			properties.setProperty("gov.nist.javax.sip.MAX_MESSAGE_SIZE",
					"1048576");
			properties.setProperty("gov.nist.javax.sip.TRACE_LEVEL", "16");
			// Drop the client connection after we are done with the
			// transaction.
			properties.setProperty(
					"gov.nist.javax.sip.CACHE_CLIENT_CONNECTIONS", "false");

			sipStack = sipFactory.createSipStack(properties);
			headerFactory = sipFactory.createHeaderFactory();
			addressFactory = sipFactory.createAddressFactory();
			messageFactory = sipFactory.createMessageFactory();
			udpListeningPoint = sipStack.createListeningPoint(host, port,
					transport.toLowerCase());
			sipProvider = sipStack.createSipProvider(udpListeningPoint);
			sipProvider.addSipListener(this);
//			SIPPlugin.isStackInitilazed = true;
			return true;
		} catch (Exception e) {
			e.printStackTrace();
			logger.log(Level.SEVERE, "Initial SIP stack error"+e.getMessage());
		}
		return true;
	}

	public String processRegistration(Registration action) {
		try {
			boolean isValidRegServerAddress = validateSIPAddress(action
					.getToURI().toString());
			boolean isValidRegAddress = validateSIPAddress(action.getFromURI()
					.toString());
			if (isValidRegServerAddress == true && isValidRegAddress == true) {
				RegisterHandler handler = new RegisterHandler();
				synchronized (handler) {
					registers.put(action.getCallID(), handler);
					handler.processCallAction(action);
					handler.wait(10000);
					if(results.containsKey(action.getCallID())){
						return results.remove(action.getCallID());
					} else return "800";
				}
			} else return "900";
		} catch (Exception e) {
			e.printStackTrace();
			if (logger.isLoggable(Level.WARNING)) {
				logger.log(Level.WARNING, "InvalidArgumentException: "
						+ e.getMessage(), e);
			}
			return "900";
		}
	}

	public Address createSIPAddress(String addressStr) {
		Address address = null;
		try {
			address = addressFactory.createAddress(addressStr);
		} catch (ParseException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
		}
		return address;
	}

	public boolean validateSIPAddress(String addressStr) {
		boolean isValid = false;

		try {
			addressFactory.createAddress(addressStr);
			isValid = true;
		} catch (Exception e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
		}
		if (isValid == true) {
			if (logger.isLoggable(Level.FINE)) {
				logger.log(Level.FINE, "Validate SIP address: " + addressStr
						+ ", which is valid.");
			}
		} else {
			if (logger.isLoggable(Level.INFO)) {
				logger.log(Level.INFO, "Validate SIP address: " + addressStr
						+ ", which is invalid.");
			}
		}
		return isValid;
	}

	public void processDialogTerminated(
			DialogTerminatedEvent dialogTerminatedEvent) {

	}

	public void processIOException(IOExceptionEvent exceptionEvent) {
		// TODO Auto-generated method stub

	}

	public void processRequest(RequestEvent requestEvent) {
		Request request = requestEvent.getRequest();
		if(request.getMethod().equalsIgnoreCase(Request.OPTIONS)){
			this.processOPTIONS(requestEvent);
			return;
		}
		
	}
	
	private void processOPTIONS(RequestEvent requestEvent) {
		try {
			Request request = requestEvent.getRequest();
			ContactHeader contactHeader = MessageMaker
					.getContactHeader(Monitor.getInstance().fromURI);
			Response OK_200 = messageFactory.createResponse(Response.OK, request);
			OK_200.addHeader(contactHeader);
			ServerTransaction serverTransaction = sipProvider.getNewServerTransaction(request);
			serverTransaction.sendResponse(OK_200);
		} catch (ParseException e) {
			logger.warning(e.getMessage());
		} catch (SipException e) {
			logger.warning(e.getMessage());
		} catch (InvalidArgumentException e) {
			logger.warning(e.getMessage());
		}

	}

	public void processResponse(ResponseEvent responseEvent) {
		String call_id = ((CallIdHeader) responseEvent.getResponse().getHeader(
				CallIdHeader.NAME)).getCallId();
		if (!registers.containsKey(call_id))
			return;
		RegisterHandler handler = registers.get(call_id);
		synchronized (handler) {
			int statusCode = responseEvent.getResponse().getStatusCode();
			if (statusCode == 200) {
				results.put(call_id, statusCode+"");
				registers.remove(call_id);
				handler.notifyAll();
			} else if (statusCode == 401) {
				try {
					Request requestAuth = handler.createAuthRegister(responseEvent
							.getResponse());
					handler.inviteTid = C5SipProvider.getInstance().sipProvider
							.getNewClientTransaction(requestAuth);
					handler.inviteTid.sendRequest();
				} catch (Exception e) {
					logger.log(Level.WARNING, "send register request", e);
					registers.remove(call_id);
					results.put(call_id, "401");
					handler.notifyAll();
				}
			} else if (statusCode == 403) {
				logger.warning("error password for sip register! \r\n" 
						+ handler.getCallAction().getFromURI() + "\r\n"
						+ handler.getCallAction().getFromURI().getPassword());
				results.put(call_id, "403");
				registers.remove(call_id);
				handler.notifyAll();
			} else if (statusCode == 404) {
				logger.warning("error extension for sip register! \r\n" 
						+ handler.getCallAction().getFromURI());
				results.put(call_id, "404");
				registers.remove(call_id);
				handler.notifyAll();
			} else if (statusCode == 408) {
				results.put(call_id, "408");
				registers.remove(call_id);
				handler.notifyAll();
			} else if (statusCode > 300) {
				logger.warning("sip register failed! "+statusCode+"\r\n" 
						+ handler.getCallAction().getFromURI());
				results.put(call_id, ""+statusCode);
				registers.remove(call_id);
				handler.notifyAll();
			}
		}
	}

	public void processTimeout(TimeoutEvent timeoutEvent) {
		Request request;
		if (timeoutEvent.isServerTransaction()) {
			ServerTransaction st = timeoutEvent.getServerTransaction();
			request = st.getRequest();

		} else {
			ClientTransaction ct = timeoutEvent.getClientTransaction();
			request = ct.getRequest();
		}
		
		CallIdHeader callIdHeader = (CallIdHeader) request
				.getHeader(CallIdHeader.NAME);
		String callId = callIdHeader.getCallId();
		RegisterHandler handler = registers.get(callId);
		if(handler != null){
			synchronized (handler) {
				results.put(callId, "800");
				registers.remove(callId);
				handler.notifyAll();
			}
		}
	}

	public void processTransactionTerminated(
			TransactionTerminatedEvent transactionTerminatedEvent) {
	}
}