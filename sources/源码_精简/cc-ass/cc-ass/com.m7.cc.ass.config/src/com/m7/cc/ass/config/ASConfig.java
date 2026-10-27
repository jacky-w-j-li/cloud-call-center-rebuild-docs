package com.m7.cc.ass.config;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.Vector;
import java.util.regex.Pattern;

import com.m7.cc.ass.config.model.Binded400;
import com.m7.cc.ass.config.model.CallNumberInfo;
import com.m7.cc.ass.config.model.District;
import com.m7.cc.ass.config.model.Province;
import com.m7.cc.bill.BillInterfaceRequirer;
import com.m7.cc.command.Fields;
import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;
import com.m7.cc.config.ConfigureParserException;

/**
 * This class is the configuration of Asterisk Status Server.
 * @author caizhibin 2009-6-10
 *
 */
public class ASConfig {
	
	public final static String confFile = "server.conf";
	public final static String resourcePath = "resource";
	
	//parameters of server peer
	public final static String SERVER = "server";
	public final static String LOG_LEVEL = "log.level";
	public final static String LOG_CONSOLE = "log.console";
	public final static String LOG_DIR = "log.dir";
	public final static String HTTP_TIMEOUT = "http.timeout";
	public final static String ACCOUNT_PREFIX = "account.prefix";
	public final static String ASS_PORT = "ass.port";
	public final static String ACS_PORT = "acs.port";
	public final static String GW_PORT = "gw.port";
	
	public static final String server = "server";
	public static final String ConfigPath = "ConfigPath";
	public static final String VM_PATH = "vm.path";
	public static final String PBX = "PBX";
	public static final String DISTRIC_NO = "district";
	public static final String DIALOUT_LINE = "dialout.line";
	public static final String DIALOUT_PORT = "dialout.port";
	public static final String MonitorDuration = "monitorDuration";
	public static final String SOX = "sox";
	public static final String LAME = "lame";
	public static final String FileServer = "fileServer";
	public static final String QueueScan = "queue.scan";
	public static final String UcUrl = "uc.url";
	public static final String UcPort = "uc.port";
	public static final String PLATFORM = "platform";
	public static final String QiniuPushFile = "qiniu.push.file";
	public static final String AstLazyReload = "ast.lazy.reload";
	public static final String MultiChannelDispatcherUrl = "multi.channel.dispatcher.url";
	public static final String KdxfAsrCount = "kdxf.asr.count";	
	//------sip.conf allow code
	public static final String SIPCODE_LOCAL = "sipCode.local";
	public static final String SIPCODE_SIP = "sipCode.sip";
	public static final String SIPCODE_LOCAL_ACCOUNT = "sipCode.local.account";
	public static final String SIPCODE_SIP_ACCOUNT = "sipCode.sip.account";
	//file name of vm-------------------------------------
	public static final String VM_SERVICE = "serviceNo.tpl";
	public static final String VM_EXTENSIONS = "extensions.tpl";
	public static final String VM_QUEUE = "queue.tpl";
	public static final String VM_TIME_CONDITION = "timecondition.tpl";
	public static final String VM_IVR = "ivr.tpl";
	public static final String VM_DIALEXTENNODE = "dialexten.tpl";
	public static final String VM_DYNAMICEROUTENODE = "dynamicroute.tpl";
	public static final String VM_ASSIGNMENTNODE = "assignment.tpl";
	public static final String VM_DIALJOBNUMNODE = "dialjobnum.tpl";
	public static final String VM_IVRVALIDATENODE = "ivr_validate.tpl";
	public static final String VM_IVR_KEY = "ivrkey.tpl";
	public static final String VM_ANNOUNCEMENT = "announcement.tpl";
	public static final String VM_SWITCHBOARD = "switchboard.tpl";
	public static final String VM_IVRMENU = "ivr_menu.tpl";
	public static final String VM_SUPERDIALJOBNUM = "superDialJobNum.tpl";
//----------------------------------
	public static final String VM_SATISFACTION = "satisfaction.tpl";
	public static final String VM_DIALOUT_263 = "dialout263.tpl";
	public static final String VM_DIALOUT = "dialout.tpl";
//	public static final String VM_XFER = "xfer.tpl";
//	public static final String VM_XFER_263 = "xfer263.tpl";
	public static final String VM_VALIDATE = "validate.tpl";
	public static final String VM_VOICEMAIL = "voicemail.tpl";
	public static final String VM_CALLURL = "callurl.tpl";
	public static final String VM_TWOWAYCALL = "twowaycall.tpl";;
	public static final String VM_TEXT_ANNOUNCEMENT = "textannouncement.tpl";
	public static final String VM_ENCRYPTMD5 = "encryptmd5.tpl";
	public static final String VM_LINE = "line.tpl";
	public static final String VM_ROUTE = "route.tpl";
	public static final String VM_ROOM = "room.tpl";
	//----------------------------------------------------
	
	//file name of source file
	public static final String PHONE_NUMBER_FILE = "phone";
	public static final String BINDED_400_FILE = "400";
	public static final String ZH_LIST_FILE = "zh_list_coded";
	public static final String PROVINCE_FILE = "province";
	public static final String DISTRICT_FILE = "district";
	
	public static final String AudioDirectory = "sound";
	
	//parameters of C5 fields
	public final static String C5FIELD = "C5field";
	
	//parameters of Asterisk AMI
	public final static String HOST = "host";
	public final static String PORT = "port";
	public final static String USER = "user";
	public final static String PASSWORD = "password";

	//parameters of CDR
	public final static String CDR = "cdr";
	
	private ConfigProvider confProvider;
	private Configure config;
	
	private int assPort = 7788;
	private int acsPort = 7789;
	private int gwPort = 7787;
	
	//monitor
	public final static String MONITOR = "monitor";
	private ConfPeer monitorPeer;
	private String monitorUser;
	private String monitorPassword;
	
	//validate
	public static final String VALIDATE = "validate";
	private ConfPeer validatePeer;
	//<account, validateNo>
	private Hashtable<String, String> validateNos = new Hashtable<String, String>(); 
	
	//Default log level is INFO and non-system out
	private ConfPeer serverPeer;
	private String logLevel = "INFO";
	private boolean logConsole = false;
	private String logDir = "./log";
	private String sox = "sox";
	private String lame = "lame";
	private Hashtable<String, String> sipAddresses = new Hashtable<String, String>();
	private Hashtable<String, Integer> sipPorts = new Hashtable<String, Integer>();
	
	private int httpTimeout = 40;
	private Hashtable<String, Hashtable<String, CallNumberInfo>> phoneNumbers = new Hashtable<String, Hashtable<String, CallNumberInfo>>();
	private Hashtable<String, CallNumberInfo> districtInfos = new Hashtable<String, CallNumberInfo>();
	private List<CallNumberInfo> newCallNumberInfoCache = new ArrayList<CallNumberInfo>();
	private Hashtable<String, Binded400> binded400s = new Hashtable<String, Binded400>();
	private HashMap<String, String> zhList = new HashMap<String, String>();
	private HashMap<String, Province> provinces = new HashMap<String, Province>();
	private HashMap<String, District> districts = new HashMap<String, District>();
	private List<String> sipCodeLocalList = null;
	private List<String> sipCodeSipList = null;
	private HashMap<String, List<String>> sipCodeLocalListAccount = null;
	private HashMap<String, List<String>> sipCodeSipListAccount = null;
	private Hashtable<String, String> pbxCustomAreaAccMap = new Hashtable<String, String>();
	
	//-1 never delete monitor files
	private int monitorDuration = -1;
	
	private String fileServer = "";
	private String ucUrl = "";
	private String ucPort = "";
	private String platform = "";
	private String qiniupPushFile = "";
	private String astLazyReload = "";
	private String multiChannelDispatcherUrl = "";
	private int kdxfAsrCount = 1;
	
	private String vmService = "";
	private String vmExtensions = "";
	private String vmQueue = "";
	private String vmTimeCondition = "";
	private String vmIvr = "";
	private String vmDialextenNode = "";
	private String vmDynamicRouteNode = "";
	private String vmAssignmentNode = "";
	private String vmDialJobNumNode = "";
	private String vmIvrValidateNode = "";
	private String vmIvrKey = "";
	private String vmAnnouncement = "";
	private String vmSwitchBoard = "";
	private String vmIvrMenu = "";
	//----------------
	private String vmSatisfaction = "";
	private String vmSuperDialJobNum = "";
	private String vmDialout263 = "";
	private String vmDialout = "";
	private String vmValidate = "";
	private String vmVoicemail = "";
	private String vmCallUrl = "";
	private String vmTwowaycall = "";
	private String vmTextAnnouncement = "";
	private String vmEncryptMD5 = "";
	private String vmLine = "";
	private String vmRoute = "";
	private String vmRoom = "";
	
	private String configPath = "/etc/asterisk";
	private String districtNo = "";
	private String dialoutLine = "";
	private String dialoutPort = "";
	
	private String vmPath = "./template";
	
	//database peer
	private ConfPeer cdrPeer;
	private String cdrUser;
	private String cdrPassword;
	
	//AMI configuration
	private Hashtable<String, ConfPeer> asteriskPeers;
	
	private Hashtable<String, AMIContacts> amiContacts;
	
	private Vector<ASConfigListener> listeners = new Vector<ASConfigListener>();
	
	private static int threeWayCallRoom = 100000;
	
	public static String serverName = "7Moor CC ASS Server";
	public static String version = "1.4.0";
	
	private static ASConfig instance;
	
	private ASConfig(String file){
		instance = this;
		confProvider = new ConfigProvider();
		asteriskPeers = new Hashtable<String, ConfPeer>();
		amiContacts = new Hashtable<String, AMIContacts>();
		loadConfig();
	}
	
	public static ASConfig getInstance(){
		if(instance == null)
			new ASConfig(confFile);
		return instance;
	}
	
	/**
	 * Load configuration from configure file. And then set them into ServerConfig.
	 * @return boolean return the loading and parser result.
	 */
	private boolean loadConfig() {
		//Check configure file
		if (confFile == null || confFile.equalsIgnoreCase("")) {
			System.out.println("Can not load configure file, it is null");
			return false;
		}

		File file = new File(confFile);
		if(!file.exists()){
			System.out.println("Can not find configure file ["+confFile+"].");
			return false;
		}
		
		if(!file.canRead()){
			System.out.println("Can not read configure file ["+confFile+"].");
			return false;
		}
		
		System.out.println("Load configuration from ["+confFile+"]");
		//Start loading
		try {
			config = confProvider.parser(confFile);
			updateConfig();
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}
	
	private void updateConfig() throws Exception{
		loadPhoneNumber();
		loadbinded400();
		loadProvince();
		loadDistrict();
		loadTTSZhList();
		serverPeer = config.getPeer(SERVER);
		if(serverPeer == null)
			throw new Exception("Can not find peer [server]");
		if(serverPeer.contain(LOG_LEVEL))
			logLevel = serverPeer.getParam(LOG_LEVEL);
		if(serverPeer.contain(LOG_CONSOLE))
			logConsole = serverPeer.getParam(LOG_CONSOLE).equalsIgnoreCase("yes")?true:false;
		if(serverPeer.contain(LOG_DIR))
			logDir = serverPeer.getParam(LOG_DIR);
		if(serverPeer.contain(SOX))
			sox = serverPeer.getParam(SOX);
		if(serverPeer.contain(LAME))
			lame = serverPeer.getParam(LAME);
		if(serverPeer.contain(HTTP_TIMEOUT))
			httpTimeout = Integer.valueOf(serverPeer.getParam(HTTP_TIMEOUT));
		if(serverPeer.contain(ConfigPath))
			configPath = serverPeer.getParam(ConfigPath);
		if(serverPeer.contain(VM_PATH))
			vmPath = serverPeer.getParam(VM_PATH);
		if(serverPeer.contain(DISTRIC_NO))
			districtNo = serverPeer.getParam(DISTRIC_NO);
		if(serverPeer.contain(DIALOUT_LINE))
			dialoutLine = serverPeer.getParam(DIALOUT_LINE);
		if(serverPeer.contain(DIALOUT_PORT))
			dialoutPort = serverPeer.getParam(DIALOUT_PORT);
		if(serverPeer.contain(ASS_PORT))
			assPort = Integer.valueOf(serverPeer.getParam(ASS_PORT));
		if(serverPeer.contain(ACS_PORT))
			acsPort = Integer.valueOf(serverPeer.getParam(ACS_PORT));
		if(serverPeer.contain(GW_PORT))
			gwPort = Integer.valueOf(serverPeer.getParam(GW_PORT));
		if(serverPeer.contain(MonitorDuration))
			monitorDuration = Integer.valueOf(serverPeer.getParam(MonitorDuration));
		if(serverPeer.contain(FileServer))
			fileServer = serverPeer.getParam(FileServer);
		if(serverPeer.contain(UcUrl))
			ucUrl = serverPeer.getParam(UcUrl);
		if(serverPeer.contain(UcPort))
			ucPort = serverPeer.getParam(UcPort);
		if(serverPeer.contain(PLATFORM))
			platform = serverPeer.getParam(PLATFORM);
		if(serverPeer.contain(QiniuPushFile))
			qiniupPushFile = serverPeer.getParam(QiniuPushFile);
		if(serverPeer.contain(AstLazyReload))
			astLazyReload = serverPeer.getParam(AstLazyReload);
		if(serverPeer.contain(KdxfAsrCount))
			kdxfAsrCount = Integer.valueOf(serverPeer.getParam(KdxfAsrCount));
		if(serverPeer.contain(MultiChannelDispatcherUrl))
			multiChannelDispatcherUrl = serverPeer.getParam(MultiChannelDispatcherUrl);
		if(serverPeer.contain(SIPCODE_LOCAL)){
			this.loadSipCodeLocal(serverPeer.getParam(SIPCODE_LOCAL));
		}else{
			if(this.sipCodeLocalList != null){
				this.sipCodeLocalList.removeAll(sipCodeLocalList);				
			}
		}
		if(serverPeer.contain(SIPCODE_SIP)){
			this.loadSipCodeSip(serverPeer.getParam(SIPCODE_SIP));
		}else{
			if(this.sipCodeSipList != null){
				this.sipCodeSipList.removeAll(sipCodeSipList);				
			}
		}
		if(serverPeer.contain(SIPCODE_LOCAL_ACCOUNT)){
			this.loadSipCodeLocalAccount(serverPeer.getParam(SIPCODE_LOCAL_ACCOUNT));
		}else{
			if(this.sipCodeLocalListAccount != null){
				this.sipCodeLocalListAccount.clear();			
			}
		}
		if(serverPeer.contain(SIPCODE_SIP_ACCOUNT)){
			this.loadSipCodeSipAccount(serverPeer.getParam(SIPCODE_SIP_ACCOUNT));
		}else{
			if(this.sipCodeSipListAccount != null){
				this.sipCodeSipListAccount.clear();				
			}
		}
		//load vm
		loadVM();
		
		cdrPeer = config.getPeer(CDR);
		if(cdrPeer != null){
			cdrUser = cdrPeer.getParam(USER);
			cdrPassword = cdrPeer.getParam(PASSWORD);
		} 
		
		
		monitorPeer = config.getPeer(MONITOR);
		if(monitorPeer != null){
			monitorUser = monitorPeer.getParam(USER);
			monitorPassword = monitorPeer.getParam(PASSWORD);
		}
		
		validatePeer = config.getPeer(VALIDATE);
		if(validatePeer != null){
			validateNos.putAll(validatePeer.getParams());
		}
		
		ConfPeer[] peers = config.getAllPeers();
		for(int i=0;i<peers.length;i++){
			if(peers[i].getName().equalsIgnoreCase(SERVER) 
					|| peers[i].getName().equalsIgnoreCase(C5FIELD)
					|| peers[i].getName().equalsIgnoreCase(CDR)
					|| peers[i].getName().equalsIgnoreCase(MONITOR)
					|| peers[i].getName().equalsIgnoreCase(VALIDATE))
				continue;
			else {
				asteriskPeers.put(peers[i].getName(), peers[i]);
				AMIContacts ami = new AMIContacts(peers[i]);
				amiContacts.put(ami.getId(), ami);
				readSipInfo(ami.getHost());
			}
		}
	}
	
	private void loadDistrict() {
		districts.clear();
		File file = new File(resourcePath + File.separator + DISTRICT_FILE);
		BufferedReader br = null;
		if (file.exists()) {
			try {
				br = new BufferedReader(new InputStreamReader(
						new FileInputStream(file), "UTF-8"), 2048);
				String line = null;
				String[] arr;
				while ((line = br.readLine()) != null
						&& (line.indexOf("|")) > -1) {
					arr = line.split("\\|");
					if (arr.length > 2)
						districts.put(arr[1], new District(arr[1], arr[2],
								arr[0]));
				}

			} catch (IOException e) {
				e.printStackTrace();
			} finally {
				try {
					if (br != null)
						br.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
				br = null;
			}

		} else {
			System.out
					.println("[Warning]The district file not found which in the resource path.");
		}

	}

	private void loadProvince() {
		provinces.clear();
		File file = new File(resourcePath + File.separator + PROVINCE_FILE);
		BufferedReader br = null;
		if (file.exists()) {
			try {
				br = new BufferedReader(new InputStreamReader(
						new FileInputStream(file), "UTF-8"), 2048);
				String line = null;
				String[] arr;
				while ((line = br.readLine()) != null
						&& (line.indexOf("|")) > -1) {
					arr = line.split("\\|");
					provinces.put(arr[0], new Province(arr[0], arr[1]));
				}

			} catch (IOException e) {
				e.printStackTrace();
			} finally {
				try {
					if (br != null)
						br.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
				br = null;
			}
		} else {
			System.out
					.println("[Warning]The province file not found which in the resource path.");
		}
	}

	public void readSipInfo(String pbx){
		File file = new File(this.configPath +File.separator+pbx+File.separator+"sip.conf");
		if(file.exists()){
			try {
				BufferedReader br = new BufferedReader(new FileReader(file));
				String line = null;
				boolean portReady = false;
				boolean addressReady = false;
				while ((line = br.readLine()) != null){
					if(line.startsWith("bindport")){
						String[] context = line.split("=");
						if(context.length > 1){
							String port = context[1];
							int index = port.indexOf(';');
							if(index > -1){
								port = port.substring(0, index);
							}
							sipPorts.put(pbx, Integer.valueOf(port.trim()));
						}
						portReady = true;
					} else if (line.startsWith("bindaddr")){
						String[] context = line.split("=");
						if(context.length > 1){
							String address = context[1];
							int index = address.indexOf(';');
							if(index > -1){
								address = address.substring(0, index);
							}
							sipAddresses.put(pbx, address.trim());
						}
						addressReady = true;
					}
					
					if(portReady && addressReady)
						break;
				}
				br.close();
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		
		
	}
	
	public boolean reload() throws Exception{
		loadPhoneNumber();
		loadbinded400();
		loadProvince();
		loadDistrict();
		loadTTSZhList();
		CallRoute.loadRoute();
		AllBlackNums.loadAllBlackNums();
		config = confProvider.parser(confFile);
		serverPeer = config.getPeer(SERVER);
		if(serverPeer == null)
			throw new Exception("Can not find peer [server]");
		if(serverPeer.contain(LOG_LEVEL))
			logLevel = serverPeer.getParam(LOG_LEVEL);
		if(serverPeer.contain(LOG_CONSOLE))
			logConsole = serverPeer.getParam(LOG_CONSOLE).equalsIgnoreCase("yes")?true:false;
		if(serverPeer.contain(LOG_DIR))
			logDir = serverPeer.getParam(LOG_DIR);
		if(serverPeer.contain(SOX))
			sox = serverPeer.getParam(SOX);
		if(serverPeer.contain(LAME))
			lame = serverPeer.getParam(LAME);
		if(serverPeer.contain(ConfigPath))
			configPath = serverPeer.getParam(ConfigPath);
		if(serverPeer.contain(HTTP_TIMEOUT))
			httpTimeout = Integer.valueOf(serverPeer.getParam(HTTP_TIMEOUT));
		if(serverPeer.contain(DISTRIC_NO))
			districtNo = serverPeer.getParam(DISTRIC_NO);
		if(serverPeer.contain(DIALOUT_LINE))
			dialoutLine = serverPeer.getParam(DIALOUT_LINE);
		if(serverPeer.contain(DIALOUT_PORT))
			dialoutPort = serverPeer.getParam(DIALOUT_PORT);
		if(serverPeer.contain(ASS_PORT))
			assPort = Integer.valueOf(serverPeer.getParam(ASS_PORT));
		if(serverPeer.contain(ACS_PORT))
			acsPort = Integer.valueOf(serverPeer.getParam(ACS_PORT));
		if(serverPeer.contain(GW_PORT))
			gwPort = Integer.valueOf(serverPeer.getParam(GW_PORT));
		if(serverPeer.contain(MonitorDuration))
			monitorDuration = Integer.valueOf(serverPeer.getParam(MonitorDuration));
		if(serverPeer.contain(FileServer))
			fileServer = serverPeer.getParam(FileServer);
		if(serverPeer.contain(UcUrl))
			ucUrl = serverPeer.getParam(UcUrl);
		if(serverPeer.contain(UcPort))
			ucPort = serverPeer.getParam(UcPort);
		if(serverPeer.contain(PLATFORM))
			platform = serverPeer.getParam(PLATFORM);
		if(serverPeer.contain(QiniuPushFile))
			qiniupPushFile = serverPeer.getParam(QiniuPushFile);
		if(serverPeer.contain(AstLazyReload))
			astLazyReload = serverPeer.getParam(AstLazyReload);
		if(serverPeer.contain(MultiChannelDispatcherUrl))
			multiChannelDispatcherUrl = serverPeer.getParam(MultiChannelDispatcherUrl);
		if(serverPeer.contain(SIPCODE_LOCAL)){
			this.loadSipCodeLocal(serverPeer.getParam(SIPCODE_LOCAL));
		}else{
			if(this.sipCodeLocalList != null){
				this.sipCodeLocalList.removeAll(sipCodeLocalList);				
			}
		}
		if(serverPeer.contain(SIPCODE_SIP)){
			this.loadSipCodeSip(serverPeer.getParam(SIPCODE_SIP));
		}else{
			if(this.sipCodeSipList != null){
				this.sipCodeSipList.removeAll(sipCodeSipList);				
			}
		}
		if(serverPeer.contain(SIPCODE_LOCAL_ACCOUNT)){
			this.loadSipCodeLocalAccount(serverPeer.getParam(SIPCODE_LOCAL_ACCOUNT));
		}else{
			if(this.sipCodeLocalListAccount != null){
				this.sipCodeLocalListAccount.clear();			
			}
		}
		if(serverPeer.contain(SIPCODE_SIP_ACCOUNT)){
			this.loadSipCodeSipAccount(serverPeer.getParam(SIPCODE_SIP_ACCOUNT));
		}else{
			if(this.sipCodeSipListAccount != null){
				this.sipCodeSipListAccount.clear();				
			}
		}
		loadVM();
		
		cdrPeer = config.getPeer(CDR);
		if(cdrPeer != null){
			String cdruser = cdrPeer.getParam(USER);
			String cdrpassword = cdrPeer.getParam(PASSWORD);
			this.cdrUser = cdruser;
			this.cdrPassword = cdrpassword;
		} 
		
		monitorPeer = config.getPeer(MONITOR);
		if(monitorPeer != null){
			monitorUser = monitorPeer.getParam(USER);
			monitorPassword = monitorPeer.getParam(PASSWORD);
		}
		
		validatePeer = config.getPeer(VALIDATE);
		validateNos.clear();
		if(validatePeer != null){
			validateNos.putAll(validatePeer.getParams());
		}
		
		ConfPeer[] peers = config.getAllPeers();
		Vector<String> removedPBX = new Vector<String>();
		Vector<String> addedPBX = new Vector<String>();
		Vector<String> changedPBX = new Vector<String>();
		
		//Find the removed pbx
		Iterator<String> it = amiContacts.keySet().iterator();
		while(it.hasNext()){
			String key = it.next();
			if(config.getPeer(key) == null){
				amiContacts.remove(key);
				removedPBX.add(key);
			}
		}
		for(int i=0;i<peers.length;i++){
			if(peers[i].getName().equalsIgnoreCase(SERVER) 
					|| peers[i].getName().equalsIgnoreCase(C5FIELD)
					|| peers[i].getName().equalsIgnoreCase(CDR)
					|| peers[i].getName().equalsIgnoreCase(MONITOR)
					|| peers[i].getName().equalsIgnoreCase(VALIDATE))
				continue;
			else {
				asteriskPeers.put(peers[i].getName(), peers[i]);
				AMIContacts ami = new AMIContacts(peers[i]);
				if(amiContacts.containsKey(ami.getId())){
					AMIContacts ami1 = amiContacts.remove(ami.getId());
					if(!ami1.getHost().equalsIgnoreCase(ami.getHost())
							|| ami1.getPort() != ami.getPort()
							|| !ami1.getUser().equalsIgnoreCase(ami.getUser())
							|| !ami1.getPassword().equalsIgnoreCase(ami.getPassword()))
						changedPBX.add(ami.getId());
				} else {
					addedPBX.add(ami.getId());
				}
				amiContacts.put(ami.getId(), ami);
				readSipInfo(ami.getHost());
			}
		}
		synchronized (listeners) {
			for(int i=0; i<listeners.size(); i++){
				ASConfigListener listener = listeners.get(i);
				while(removedPBX.size() > 0)
					listener.pbxRemoved(removedPBX.remove(0));
				while(addedPBX.size() > 0)
					listener.pbxAdd(addedPBX.remove(0));
				while(changedPBX.size() > 0)
					listener.pbxChanged(changedPBX.remove(0));
			}
		}
			
		return true;
	}
	
	public void loadVM() {
		try {
			this.vmExtensions = readFile(vmPath + "/" + VM_EXTENSIONS);
			this.vmService = readFile(vmPath + "/" + VM_SERVICE);
			this.vmQueue = readFile(vmPath + "/" + VM_QUEUE);
			this.vmIvr = readFile(vmPath + "/" + VM_IVR);
			// Aman zhai. 2010.06.09
			this.vmDialextenNode = readFile(vmPath + "/" + VM_DIALEXTENNODE);
			this.vmDynamicRouteNode = readFile(vmPath + "/" + VM_DYNAMICEROUTENODE);
			this.vmAssignmentNode = readFile(vmPath + "/" + VM_ASSIGNMENTNODE);
			this.vmDialJobNumNode = readFile(vmPath + "/" + VM_DIALJOBNUMNODE);
			// <--
			this.vmIvrKey = readFile(vmPath + "/" + VM_IVR_KEY);
			this.vmTimeCondition = readFile(vmPath + "/" + VM_TIME_CONDITION);
			this.vmAnnouncement = readFile(vmPath + "/" + VM_ANNOUNCEMENT);
			this.vmDialout = readFile(vmPath + "/" + VM_DIALOUT);
			this.vmDialout263 = readFile(vmPath + "/" + VM_DIALOUT_263);
			this.vmValidate = readFile(vmPath + "/" + VM_VALIDATE);
			this.vmVoicemail = readFile(vmPath + "/" + VM_VOICEMAIL);
			this.vmCallUrl = readFile(vmPath + "/" + VM_CALLURL);
			this.vmTwowaycall = readFile(vmPath + "/" + VM_TWOWAYCALL);
			this.vmTextAnnouncement = readFile(vmPath + "/" + VM_TEXT_ANNOUNCEMENT);
			this.vmEncryptMD5 = readFile(vmPath + "/" + VM_ENCRYPTMD5);
			this.vmLine = readFile(vmPath + "/" + VM_LINE);
			this.vmRoute = readFile(vmPath + "/" + VM_ROUTE);
			this.vmRoom = readFile(vmPath + "/" + VM_ROOM);
			//add by chenguang 
			this.vmSatisfaction = readFile(vmPath + "/" + VM_SATISFACTION);
			this.vmIvrValidateNode = readFile(vmPath + "/" + VM_IVRVALIDATENODE);
			this.vmIvrMenu = readFile(vmPath + "/" + VM_IVRMENU);
			this.vmSwitchBoard = readFile(vmPath + "/" + VM_SWITCHBOARD);
			this.vmSuperDialJobNum = readFile(vmPath + "/" + VM_SUPERDIALJOBNUM);
		} catch (IOException e) {
			System.out.println("Load VM failed: ");
			e.printStackTrace();
		}
	}
	
	private void loadSipCodeLocal(String codes){
		// sipCode.local=speex,g729,alaw
		sipCodeLocalList = new ArrayList<String>();
		String allowCodes = codes;
		String[] codeArr = allowCodes.split("\\,");
		if (codeArr.length > 0) {
			for (String arr : codeArr) {
				System.out.println(arr);
				sipCodeLocalList.add(arr);
			}
		}
	}
	
	private void loadSipCodeSip(String codes){
		// sipCode.local=speex,g729,alaw
		sipCodeSipList = new ArrayList<String>();
		String allowCodes = codes;
		String[] codeArr = allowCodes.split("\\,");
		if (codeArr.length > 0) {
			for (String arr : codeArr) {
				sipCodeSipList.add(arr);
			}
		}
	}
	
	private void loadSipCodeLocalAccount(String allows){
		//sipCode.local.account=N000000001057:g729,alaw|N000000001058:alaw
		sipCodeLocalListAccount = new HashMap<String, List<String>>();
		String allowToken = allows;
		String[] allowArr = allowToken.split("\\|");
		if (allowArr.length > 0) {
			String[] itemArr = null;
			String[] codeArr = null;
			List<String> codeList = null;
			for (String arr : allowArr) {
				itemArr = arr.split(":");
				if (itemArr.length > 1) {
					codeList = new ArrayList<String>();
					codeArr = itemArr[1].split(",");
					for (String code : codeArr) {
						codeList.add(code);
					}
					sipCodeLocalListAccount.put(itemArr[0], codeList);
				}
			}
		}
	}
	
	private void loadSipCodeSipAccount(String allows){
		//sipCode.sip.account=N000000001057:g729,alaw|N000000001058:alaw
		sipCodeSipListAccount = new HashMap<String, List<String>>();
		String allowToken = allows;
		String[] allowArr = allowToken.split("\\|");
		if (allowArr.length > 0) {
			String[] itemArr = null;
			String[] codeArr = null;
			List<String> codeList = null;
			for (String arr : allowArr) {
				itemArr = arr.split(":");
				if (itemArr.length > 1) {
					codeList = new ArrayList<String>();
					codeArr = itemArr[1].split(",");
					for (String code : codeArr) {
						codeList.add(code);
					}
					sipCodeSipListAccount.put(itemArr[0], codeList);
				}
			}
		}
	}
	
	private String readFile(String filename) throws IOException{
		File file = new File(filename);
		if (!file.exists()) {
			System.out.println("VM: cannot find " + filename);
		}
		String data = "";
		BufferedReader br = new BufferedReader(new FileReader(file));
		String line = null;
		while ((line = br.readLine()) != null) {
			data += line + "\n";
		}
		br.close();
		return data;
	}

	public void setConfigPath(String configPath) {
		this.configPath = configPath;
		serverPeer.addParam(ConfigPath, configPath);
	}
	
	public String getConfigPath() {
		return configPath;
	}

	public String getVmPath() {
		return vmPath;
	}

	public void setVmPath(String vmPath) {
		this.vmPath = vmPath;
		serverPeer.addParam(VM_PATH, vmPath);
	}

	public String getDialoutLine() {
		return dialoutLine;
	}

	public void setDialoutLine(String dialoutLine) {
		if(dialoutLine == null)
			return;
		this.dialoutLine = dialoutLine;
		this.serverPeer.addParam(DIALOUT_LINE, dialoutLine);
	}

	public void setDialoutPort(String dialoutPort) {
		if(dialoutPort == null)
			return;
		this.dialoutPort = dialoutPort;
		this.serverPeer.addParam(DIALOUT_PORT, dialoutPort);
	}

	public String getDistrictNo() {
		return districtNo;
	}
	
	public String getDistrictNo(String account){
		if(pbxCustomAreaAccMap.containsKey(account)){
			return pbxCustomAreaAccMap.get(account);
		}else{
			return ASConfig.getInstance().getDistrictNo();
		}
	}
	
	public void setDistrictNo(String districtNo) {
		this.districtNo = districtNo;
		serverPeer.addParam(DISTRIC_NO, districtNo);
	}

	public String getVmService() {
		return vmService;
	}

	public String getVmExtensions() {
		return vmExtensions;
	}

	public String getVmQueue() {
		return vmQueue;
	}

	public String getVmTimeCondition() {
		return vmTimeCondition;
	}

	public String getVmIvr() {
		return vmIvr;
	}
	
	public String getVmEncryptMD5(){
		return vmEncryptMD5;
	}
	
	public String getVMRoom(){
		return vmRoom;
	}
	
	// Aman zhai. 2010.06.09
	public String getVmDialextenNode(){
		return vmDialextenNode;
	}
	
	public String getVmAssignmentNode(){
		return vmAssignmentNode;
	}
	
	public String getVmDialJobNumNode(){
		return vmDialJobNumNode;
	}
	
	public String getVmDynamicRouteNode(){
		return vmDynamicRouteNode;
	}
	// <--

	public String getVmIvrValidateNode() {
		return vmIvrValidateNode;
	}

	public String getVmIvrKey() {
		return vmIvrKey;
	}

	public String getVmAnnouncement() {
		return vmAnnouncement;
	}
	
	public String getVmSwitchBoard() {
		return vmSwitchBoard;
	}
	//---------------------
	public String getVmSatisfaction() {
		return vmSatisfaction;
	}

	public String getVmSuperDialJobNum() {
		return vmSuperDialJobNum;
	}

	public String getVmDialout263() {
		return vmDialout263;
	}

	public String getVmDialout() {
		return vmDialout;
	}
	
	public List<String> getSipCodeLocalList(){
		return this.sipCodeLocalList;
	}
	
	public List<String> getSipCodeSipList(){
		return this.sipCodeSipList;
	}
	
	public HashMap<String, List<String>> getSipCodeLocalListAccount() {
		return sipCodeLocalListAccount;
	}
	
	public HashMap<String, List<String>> getSipCodeSipListAccount() {
		return sipCodeSipListAccount;
	}	

//	public String getVmXfer() {
//		return vmXfer;
//	}
//
//	public String getVmXfer263() {
//		return vmXfer263;
//	}


	public String getVmIvrmenu() {
		return vmIvrMenu;
	}

	public String getVmValidate() {
		return vmValidate;
	}

	public String getVmVoicemail() {
		return vmVoicemail;
	}
	
	public String getVmCallurl() {
		return vmCallUrl;
	}
	
	public String getVmTwowaycall() {
		return vmTwowaycall;
	}
	
	public String getVmTextAnnouncement(){
		return vmTextAnnouncement;
	}
	
	public String getVmLine() {
		return vmLine;
	}
	
	public String getVmRoute() {
		return vmRoute;
	}
	
	public String getVmIvrMenu() {
		return vmIvrMenu;
	}

	/**
	 * Save the configuration of Smart Server
	 * @return boolean true|false
	 */
	public boolean saveConfig(){
		try {
			confProvider.save(config);
		} catch (ConfigureParserException e) {
			e.printStackTrace();
			return false;
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public void addPeer(ConfPeer peer){
		if(config.getPeer(peer.getName()) != null)
			return;
		config.addPeer(peer);
		saveConfig();
	}
	
	public void addPbx(String ip, int port, String user, String password){
		ConfPeer peer = new ConfPeer(ip);
		peer.addParam(HOST, ip);
		peer.addParam(PORT, port+"");
		peer.addParam(USER, user);
		peer.addParam(PASSWORD, password);
		addPeer(peer);
	}
	
	public String getLogLevel() {
		return logLevel;
	}

	public void setLogLevel(String logLevel) {
		this.logLevel = logLevel;
		serverPeer.addParam(LOG_LEVEL, logLevel);
	}

	public boolean isLogConsole() {
		return logConsole;
	}

	public void setLogConsole(boolean logConsole) {
		this.logConsole = logConsole;
		serverPeer.addParam(LOG_CONSOLE, logConsole?"yes":"no");
	}

	public String getLogDir() {
		return logDir;
	}

	public String getSox() {
		return sox;
	}
	
	public String getLame() {
		return lame;
	}

	public Hashtable<String, AMIContacts> getAmiContacts() {
		return amiContacts;
	}
	
	public String[] getPbxs(){
		String[] a = new String[amiContacts.size()];
		Iterator<AMIContacts> it = amiContacts.values().iterator();
		int i=0;
		while(it.hasNext()){
			a[i] = it.next().getId();
			i++;
		}
		return a;
	}
	
	public String getFristPbxId(){
		String[] a = new String[amiContacts.size()];
		Iterator<AMIContacts> it = amiContacts.values().iterator();
		String pbxId = null;
		while(it.hasNext()){
			pbxId = it.next().getId();
			if(!pbxId.equals(Fields.gateway)){
				break;
			}
		}
		return pbxId;
	}

	public void addConfigListener(ASConfigListener listener){
		if(listeners.contains(listener))
			return;
		synchronized (listeners) {
			listeners.add(listener);
		}
	}
	
	public void removeConfigListener(ASConfigListener listener){
		if(!listeners.contains(listener))
			return;
		synchronized (listeners) {
			listeners.remove(listener);
		}
	}
	
	public void removeAllConfigListeners(){
		synchronized (listeners) {
			listeners.clear();
		}
	}

	public String getCdrUser() {
		return cdrUser;
	}

	public void setCdrUser(String cdrUser) {
		this.cdrUser = cdrUser;
		this.cdrPeer.addParam(USER, cdrUser);
	}

	public String getCdrPassword() {
		return cdrPassword;
	}

	public void setCdrPassword(String cdrPassword) {
		this.cdrPassword = cdrPassword;
		cdrPeer.addParam(PASSWORD, cdrPassword);
	}

	public int getHttpTimeout() {
		return httpTimeout;
	}

	public void setHttpTimeout(int httpTimeout) {
		this.httpTimeout = httpTimeout;
		serverPeer.addParam(HTTP_TIMEOUT, httpTimeout+"");
	}

	public String getMonitorUser() {
		return monitorUser;
	}

	public void setMonitorUser(String monitorUser) {
		this.monitorUser = monitorUser;
		monitorPeer.addParam(USER, monitorUser);
	}

	public String getMonitorPassword() {
		return monitorPassword;
	}

	public void setMonitorPassword(String monitorPassword) {
		this.monitorPassword = monitorPassword;
		monitorPeer.addParam(PASSWORD, monitorPassword);
	}

	public int getMonitorDuration() {
		return monitorDuration;
	}

	public String getDialoutPort() {
		return dialoutPort;
	}
	
	public boolean isLocalMobileNumber(String mobile, String localPrefix){
		localPrefix = localPrefix == null? this.districtNo : localPrefix;
		mobile = mobile.startsWith("0") ? mobile.substring(1) : mobile;
		try{
			String prefix = mobile.substring(0, 3);
			if (phoneNumbers.containsKey(prefix)) {
				Hashtable<String, CallNumberInfo> numbers = phoneNumbers
						.get(prefix);
				prefix = mobile.substring(0, 7);
				CallNumberInfo numberInfo = null;
				if (numbers.containsKey(prefix)) {
					numberInfo = numbers.get(prefix);
					if(numberInfo.getDistrictNo().equals(localPrefix))
						return true;
				} else {
					// if no callNumberInfo found, send require to bill system to
					// synchronize.
					this.getNewCallNumberInfo(prefix);
					numberInfo = numbers.get(prefix);
					if (numberInfo.getDistrictNo().equals(localPrefix))
						return true;
				}
			} else {
				if(mobile.length() >= 7)
					this.getNewCallNumberInfo(mobile.substring(0, 7));
			}
			return false;
		}catch(Exception e){
			return false;
		}
	}
	
	private void getNewCallNumberInfo(String prefix) throws Exception {
		boolean isNum = Pattern.matches("\\d+", prefix);
		if(isNum && prefix.startsWith("1")){
			Object result = BillInterfaceRequirer.require(ASConfig.getInstance()
					.getVar("lisence.url")
					+ "?action=service.getMobileCodeInfo&data={\"prefix\":\"" + prefix + "\"}",
					3000);
			if (result != null) {
				Map<String, Object> callNumberInfoMap = (Map<String, Object>) result;
				if(callNumberInfoMap.get("areaCode").toString().equals("") || 
						callNumberInfoMap.get("province").toString().equals("") ||
						callNumberInfoMap.get("city").toString().equals("")){
					return;
				}
				String s = prefix.substring(0, 3);
				Hashtable<String, CallNumberInfo> numbers;
				if (!phoneNumbers.containsKey(s)) {
					numbers = new Hashtable<String, CallNumberInfo>();
					phoneNumbers.put(s, numbers);
				} else {
					numbers = phoneNumbers.get(s);
				}
				CallNumberInfo numberInfo = new CallNumberInfo();
				numberInfo.setSegment(prefix);
				numberInfo.setDistrictNo(callNumberInfoMap.get("areaCode")
						.toString());
				numberInfo.setProvince(callNumberInfoMap.get("province").toString());
				numberInfo.setCity(callNumberInfoMap.get("city").toString());
				numbers.put(numberInfo.getSegment(), numberInfo);
				newCallNumberInfoCache.add(numberInfo);
				if (!districtInfos.containsKey(numberInfo.getDistrictNo())) {
					districtInfos.put(numberInfo.getDistrictNo(), numberInfo);
				}
			}
		}
	}

	public boolean isLocalMobileNumber(String mobile){
		return isLocalMobileNumber(mobile, null);
	}
	
	public boolean isLocalMobileNumber(String mobile, String localPrefix, String account){
		localPrefix = localPrefix == null? ASConfig.getInstance().getDistrictNo(account) : localPrefix;
		mobile = mobile.startsWith("0") ? mobile.substring(1) : mobile;
		try{
			String prefix = mobile.substring(0, 3);
			if (phoneNumbers.containsKey(prefix)) {
				Hashtable<String, CallNumberInfo> numbers = phoneNumbers
						.get(prefix);
				prefix = mobile.substring(0, 7);
				CallNumberInfo numberInfo = null;
				if (numbers.containsKey(prefix)) {
					numberInfo = numbers.get(prefix);
					if(numberInfo.getDistrictNo().equals(localPrefix))
						return true;
				} else {
					// if no callNumberInfo found, send require to bill system to
					// synchronize.
					this.getNewCallNumberInfo(prefix);
					numberInfo = numbers.get(prefix);
					if (numberInfo.getDistrictNo().equals(localPrefix))
						return true;
				}
			} else {
				if(mobile.length() >= 7)
					this.getNewCallNumberInfo(mobile.substring(0, 7));
			}
			return false;
		}catch(Exception e){
			return false;
		}
	}
	
	public boolean isMobileNumber(String number){
		try{
			String prefix = number.substring(0, 3);
			if(phoneNumbers.containsKey(prefix)){
				return true;
			}
			return false;
		}catch(Exception e){
			return false;
		}
	}
	
	public boolean isBinded400(String serviceNo){
		if(serviceNo == null)
			return false;
		return binded400s.containsKey(serviceNo);
	}
	
	public void addBinded400(String serviceNo, String numberOf400,
			String accountId, String isCallable) {
		if (serviceNo == null || numberOf400 == null || accountId == null || isCallable == null)
			return;
		binded400s.put(serviceNo, new Binded400(accountId, numberOf400, serviceNo, isCallable));
	}
	
	public void updateBinded400(String serviceNo, String isCallable) {
		if (serviceNo != null) {
			Binded400 bind400 = this.getBinded400ViaServiceNo(serviceNo);
			if(bind400 != null){
				binded400s.get(serviceNo).setIsCallable(isCallable);
			}
		}
	}

	public void update400File() throws IOException {
		BufferedWriter bw = null;
		File fileOf400 = new File("400");
		try {
			if (!fileOf400.exists()) {
				fileOf400.createNewFile();
			}

			StringBuilder builder = new StringBuilder();
			Set<Entry<String, Binded400>> binded400Set = getBinded400Set();
			Iterator<Entry<String, Binded400>> it = binded400Set.iterator();
			Binded400 entry = null;
			while (it.hasNext()) {
				entry = it.next().getValue();
				builder.append(entry.getServiceNo()).append("|").append(
						entry.getNumberOf400()).append("|").append(
						entry.getAccountId()).append("|").append(
						entry.getIsCallable()).append("\n");
			}
			bw = new BufferedWriter(new FileWriter(fileOf400), 1024);
			bw.write(builder.toString());
			bw.flush();
		} catch (IOException e) {
			throw e;
		} finally {
			if (bw != null) {
				try {
					bw.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
				bw = null;
				fileOf400 = null;
			}
		}
	}
	
	public void removeBinded400(String serviceNo) {
		if (serviceNo == null)
			return;
		binded400s.remove(serviceNo);
	}
	
	public Binded400 getBinded400ViaServiceNo(String serviceNo){
		if(serviceNo == null)
			return null;
		return binded400s.get(serviceNo);
	}
	
	public Set<Entry<String, Binded400>> getBinded400Set() {
		return this.binded400s.entrySet();
	}
	
	public String getOtherNum(String number){
		String otherNum = "";
		boolean isStartWithZero = number.startsWith("0");
		if(isStartWithZero == true){
			String newNumOffZero = number.substring(1);
			boolean isMobileNumber = this.isMobileNumber(newNumOffZero);
			if(isMobileNumber == true){
				otherNum = newNumOffZero;
			}else{
				CallNumberInfo numberInfo = this.getNumberInfoViaNumber(number);
				if(numberInfo != null && numberInfo.getDistrictNo() != null){
					otherNum = number.substring(numberInfo.getDistrictNo().length()).trim();
				}
			}
		}else{
			boolean isMobile = ASConfig.getInstance().isMobileNumber(number);
			if(isMobile == true){
				otherNum = "0" + number;
			}else{
				otherNum = this.getDistrictNo() + number;
			}
		}
		return otherNum;
	}
	
	public CallNumberInfo getNumberInfoViaNumber(String callNumber) {
		if(callNumber.startsWith("400") || callNumber.startsWith("800")){
			return null;
		}
		if(callNumber.length() < 4)
			return null;
		if(callNumber.startsWith("0")){
			return this.getNumberInfoViaDistrictNo(callNumber.substring(0,  4));
		}else{
			try {
				Hashtable<String, CallNumberInfo> numbers = phoneNumbers
						.get(callNumber.substring(0, 3));
				if (numbers != null && callNumber.length() >= 7){
					if(numbers.get(callNumber.substring(0, 7)) == null){
						// if no callNumberInfo found, send require to bill system to synchronize.
						String prefix = callNumber.substring(0, 7);
						this.getNewCallNumberInfo(prefix);
						return numbers.get(prefix);	
					}else{
						return numbers.get(callNumber.substring(0, 7));						
					}
				}else{
					// if no callNumberInfo found, send require to bill system to synchronize.
					String prefix = callNumber.substring(0, 7);
					this.getNewCallNumberInfo(prefix);
					return numbers.get(prefix);		
				}
			} catch (Exception e) {
				return null;
			}
		}
	}
	
	public List<CallNumberInfo> getNewCallNumberInfoCache(){
		return this.newCallNumberInfoCache;
	}

	public CallNumberInfo getNumberInfoViaDistrictNo(String districtNumber) {
		if (districtNumber.length() < 3)
			return null;
		CallNumberInfo numberInfo = this.districtInfos.get(districtNumber
				.substring(0, 3));
		if (numberInfo == null && districtNumber.length() >= 4)
			return this.districtInfos.get(districtNumber.substring(0, 4));
		return numberInfo;
	}
	
	public Province getProvinceViaCode(String code) {
		if (code == null || code.equals(""))
			return null;
		return provinces.get(code);
	}

	public District getDistrictViaCode(String code) {
		if (code == null || code.equals(""))
			return null;
		return districts.get(code);
	}
	
	private void loadbinded400() {
		binded400s.clear();
		File file = new File(BINDED_400_FILE);
		BufferedReader br = null;
		if (file.exists()) {
			try {
				br = new BufferedReader(new FileReader(file));
				String line = null;
				String[] arr;
				while ((line = br.readLine()) != null
						&& (line.indexOf("|")) > -1) {
					arr = line.split("\\|");
					binded400s.put(arr[0],
							new Binded400(arr[2], arr[1], arr[0], arr[3]));
				}
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			} finally {
				try {
					if (br != null)
						br.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				br = null;
			}
		} else {
			System.out.println("[Warning]The file of 400 assgined ("
					+ BINDED_400_FILE + ") not found.");
		}
	}

	private void loadPhoneNumber(){
//		Hashtable<String, Vector<String>> localMobileNumbers = new Hashtable<String,  Vector<String>>();
		newCallNumberInfoCache.clear();
		phoneNumbers.clear();
		File file = new File(PHONE_NUMBER_FILE);
		if (file.exists()) {
			try {
				BufferedReader br = new BufferedReader(new InputStreamReader(
						new FileInputStream(file), "UTF-8"));
				String line = null;
				Hashtable<String, CallNumberInfo> numbers;
				String prefix;
				CallNumberInfo numberInfo;
				while ((line = br.readLine()) != null && line.length() > 3) {
					prefix = line.substring(0, 3);
					if (!phoneNumbers.containsKey(prefix)) {
						numbers = new Hashtable<String, CallNumberInfo>();
						phoneNumbers.put(prefix, numbers);
					} else {
						numbers = phoneNumbers.get(prefix);
					}
					numberInfo = new CallNumberInfo();
					numberInfo.setValues(line);
					numbers.put(numberInfo.getSegment(), numberInfo);
					if (!districtInfos.containsKey(numberInfo.getDistrictNo())) {
						districtInfos.put(numberInfo.getDistrictNo(),
								numberInfo);
					}
				}
				br.close();
				br = null;
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}else{
			System.out.println("[Warning]The file of phone numbers ("
					+ PHONE_NUMBER_FILE + ") not found.");
		}
	}
	
	private void loadTTSZhList() {
		File file = new File(ZH_LIST_FILE);
		BufferedReader br = null;
		try {
			br = new BufferedReader(new FileReader(file));
			String line = null;
			String[] a = null;
			zhList.clear();
			while ((line = br.readLine()) != null) {
				a = line.split(" ");
				if (a.length == 2)
					zhList.put(a[0], a[1]);
				else {
					System.out.println("Unknow tts word:" + line);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
				br = null;
			}
			file = null;
		}
	}
	
	public HashMap<String, String> getTTSZhList(){
		return this.zhList;
	}
	
	public String getPrivateTemplate(String account, String templateType) throws IOException{
		String data = "";
		File privateTemplate = new File(getVmPath()
				+ "/"
				+ account
				+ "/"
				+ templateType);
	
		
		if (privateTemplate.exists()) {
			BufferedReader br = new BufferedReader(new FileReader(
					privateTemplate));
			String lineString = null;
			while ((lineString = br.readLine()) != null) {
				data += lineString + "\n";
			}
			br.close();
		}
		return data;
	}

	public Hashtable<String, String> getSipAddresses() {
		return sipAddresses;
	}

	public Hashtable<String, Integer> getSipPorts() {
		return sipPorts;
	}

	public Hashtable<String, String> getValidateNos() {
		return validateNos;
	}
	
	public String getVar(String key) {
		return serverPeer.getParam(key);
	}
	
	public void addVar(String key, String value) {
		serverPeer.addParam(key, value);
	}

	public int getAssPort() {
		return assPort;
	}

	public int getAcsPort() {
		return acsPort;
	}

	public int getGwPort() {
		return gwPort;
	}

	public String getFileServer() {
		return fileServer;
	}

	public String getUcUrl() {
		return ucUrl;
	}

	public void setUcUrl(String ucUrl) {
		this.ucUrl = ucUrl;
	}
	
	public String getUcPort() {
		return ucPort;
	}
	
	public void setUcPort(String ucPort) {
		this.ucPort = ucPort;
	}
	
	public String getPlatform() {
		return platform;
	}

	public void setPlatform(String platform) {
		this.platform = platform;
	}

	public String getQiniupPushFile() {
		return qiniupPushFile;
	}

	public void setQiniupPushFile(String qiniupPushFile) {
		this.qiniupPushFile = qiniupPushFile;
	}
	
	public String getAstLazyReload() {
		return astLazyReload;
	}

	public void setAstLazyReload(String astLazyReload) {
		this.astLazyReload = astLazyReload;
	}

	public String getMultiChannelDispatcherUrl() {
		return multiChannelDispatcherUrl;
	}

	public int getkdxfAsrCount(){
		return kdxfAsrCount;
	}
	
	public void setKdxfAsrCount(int count) {
		this.kdxfAsrCount = count;
	}
	
	public void setMultiChannelDispatcherUrl(String multiChannelDispatcherUrl) {
		this.multiChannelDispatcherUrl = multiChannelDispatcherUrl;
	}

	public static int getThreeWayCallRoom() {
		if(threeWayCallRoom > 200000){
			threeWayCallRoom = 100000;
		} else threeWayCallRoom++;
		return threeWayCallRoom;
	}
	
	public Hashtable<String, String> getPbxCustomAreaAccMap() {
		return pbxCustomAreaAccMap;
	}

	public void setPbxCustomAreaAccMap(Hashtable<String, String> pcaa) {
		pbxCustomAreaAccMap = pcaa;
	}
	
	public static void main(String[] args){
		ASConfig as = new ASConfig("");
		//as.loadPhoneNumber();
		System.out.println(as.isMobileNumber("13128510367"));
		System.out.println(as.isLocalMobileNumber("13128510367"));
		
		CallNumberInfo info = as.getNumberInfoViaNumber("18600030392");
		System.out.println(info.getDistrictNo()+" "+info.getProvince()+" "+info.getCity());
		info = as.getNumberInfoViaDistrictNo("0755");
		System.out.println(info.getDistrictNo()+" "+info.getProvince()+" "+info.getCity());
	}
}
