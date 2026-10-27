package com.m7.cc.configuration.service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.EventInterface;
import com.m7.cc.ass.model.configuration.Announcement;
import com.m7.cc.ass.model.configuration.AssignmentNode;
import com.m7.cc.ass.model.configuration.AutoCallTask;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.CallUrl;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.DialextenNode;
import com.m7.cc.ass.model.configuration.DynamicRouteNode;
import com.m7.cc.ass.model.configuration.EncryptMD5;
import com.m7.cc.ass.model.configuration.ExtensionPeer;
import com.m7.cc.ass.model.configuration.HoldMusic;
import com.m7.cc.ass.model.configuration.IVR;
import com.m7.cc.ass.model.configuration.IVRKey;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.ass.model.configuration.IvrValidateNode;
import com.m7.cc.ass.model.configuration.MailAddr;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.RedList;
import com.m7.cc.ass.model.configuration.Room;
import com.m7.cc.ass.model.configuration.Satisfaction;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.SuperDialJobNum;
import com.m7.cc.ass.model.configuration.SwitchBoard;
import com.m7.cc.ass.model.configuration.TextAnnouncement;
import com.m7.cc.ass.model.configuration.TimeCondition;
import com.m7.cc.ass.model.configuration.TwowayCall;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.Validation;
import com.m7.cc.ass.model.configuration.Voicemail;
import com.m7.cc.ass.model.configuration.WebchatAddr;
import com.m7.cc.ass.model.configuration.WeixinAddr;
import com.m7.cc.command.Fields;
import com.m7.cc.config.ConfParser;
import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;
import com.m7.cc.config.ConfigureParserException;
import com.m7.cc.configuration.service.template.SipTemplate;
import com.m7.cc.json.JSONReader;
import com.m7.cc.json.JSONWriter;

public class ACSStorage {
	public static final String QUEUES = "queues.conf";
	public static final String SIP = "sip.conf";
	public static final String MOH = "moh.conf";
	public static final String SERVICE_NO = "service_no.conf";
	public static final String TIME_CONDITION = "time_condition.conf";
	public static final String BLACK_LIST = "blacklist.conf";
	public static final String RED_LIST = "redlist.conf";
	public static final String NUMS = "nums.conf";
	public static final String IVR = "ivr.conf";
	public static final String DIALEXTEN = "dialexten.conf"; // Aman zhai.
	// 2010.06.09
	public static final String DYNAMICROUTE = "dynamicroute.conf";// Aman zhai.
	// 2010.06.11
	public static final String ASSIGNMENT = "assignment.conf";
	public static final String DIALJOBNUM = "dialjobnum.conf";
	public static final String ANNOUNCEMENT = "announcement.conf";
	public static final String IVRVALIDATE = "ivr_validate.conf";
	
	public static final String SATISFACTION = "satisfaction.conf";
	public static final String SUPERDIALJOBNUM = "superDialJobNum.conf";
	public static final String IVRMENU = "ivr_menu.conf";
	public static final String VALIDATE = "validate.conf";
	public static final String VOICEMAIL = "voicemail.conf";
	public static final String EXTENSION_PEER = "extension_peer.conf";
	public static final String DIALOUT_LINE = "dialout_line.conf";
	public static final String XFER_LINE = "xfer_line.conf";
	public static final String USERS = "users.conf";
	public static final String CALL_URL_CONF = "callurl.conf";
	public static final String TWOWAY_CALL_CONF = "twowaycall.conf";
	public static final String TEXT_ANNOUNCEMENT_CONF = "text_announcement.conf";
	public static final String ENCRYPT_MD5_CONF = "encrypt_md5.conf";
	public static final String PHONEBAR_CONFIG_CONF = "phonebar_config.conf";
	public static final String ROOM_CONF = "room.conf";
	public static final String SWITCH_BOARD = "switch_board.conf";
	public static final String AUTO_CALL_TASK = "auto_call_task.conf";

	// Aman zhai. 2010.05.11
	public static final String EVENT_INTERFACES = "event_interfaces.conf";
	// <--

	public static final String INCLUDE_EXTENSION = "extensions_include.ael";
	public static final String INCLUDE_QUEUES = "queues_include.conf";
	public static final String INCLUDE_SIP = "sip_include.conf";
	public static final String INCLUDE_MUSICONHOLD = "musiconhold_include.conf";
	public static final String MAIL_QUEUE = "mail_queue.conf";
	public static final String MAIL_ADDR = "mail_addr.conf";
	public static final String WEIXIN_ADDR = "weixin_addr.conf";
	public static final String WEBCHAT_ADDR = "webchat_addr.conf";

	public static final String CONF = "conf";
	public static final String SOUND = "sound";
	public static final String AGI = "agi";

	private static ConfigProvider cp = new ConfigProvider();
	private static Logger log = Logger.getLogger(ACSStorage.class.getName());

	public static Hashtable<String, C5Account> loadAccounts(String pbx) {
		Hashtable<String, C5Account> accounts = new Hashtable<String, C5Account>();
		File file = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts");
		if (file.exists()) {
			String[] acts = file.list();
			for (int j = 0; j < acts.length; j++) {
				if (acts[j].matches("[A-Z][0-9]+")) {
					C5Account account = loadAccount(pbx, acts[j]);
					accounts.put(acts[j], account);
				}
			}
		}
		return accounts;
	}

	private static C5Account loadAccount(String pbx, String accountId) {
		C5Account account = new C5Account(pbx, accountId);

		// 1. load account info(fixed by chenguang 2012-9-19 :add load satisfactionOptions in this method)
		loadAccountInfo(account);

		// 2. load account username and password
		loadUser(account);

		// 3. load queue
		loadQueue(account);

		// 4.
		// loadDialextenNodes(account);

		loadDynamicRouteNodes(account);

		loadAssignmentNodes(account);

		loadDialJobNumNodes(account);
		
		loadIvrValidateNodes(account);//add by chenguang

		// 5. load serviceNo
		loadServiceNo(account);

		// 6. load blacklist
		loadBlackList(account);

		// 7. load timecondition
		loadTimeCondition(account);

		// 8. load ivr
		loadIVR(account);

		// 8.1 local callurl
		loadCallUrl(account);
		
		// 8.2 local encrypt md5
		loadEncryptMD5(account);

		// 9. load announcement
		loadAnnouncement(account);

		// 9.1 load hold music
		loadHoldMusic(account);

		// 9.2 load validate
		loadValidate(account);

		// 9.3 load voicemail
		loadVoicemail(account);

		// 9.4 load extension peer
		loadExtensionPeer(account);
		
		// 9.5 load text annnounctment
		loadTextAnnouncement(account);

		// 10. load dialout line
		loadDialoutLine(account);

		// 11. load xfer line
		loadXferLine(account);

		// 12. load sip peers
		loadSipPeer(account);
		
		// 13. load room
		loadRoom(account);
		
		// 15. load nums
		loadNum(account);

		//14. load satisfaction :add by chenguang 2012-9-19
		loadSatisfaction(account);
		
		//15. load ivrMenu :add by chenguang 2013-04-17
		loadIvrMenu(account);
		loadSwitchBoard(account);
		//17.load auto call tasks
		loadAutoCallTasks(account);
		//18.load redList
		loadRedList(account);
		//19.load superDialJobNumNode
		loadSuperDialJobNum(account);
		//20.load multi channel
		loadMailQueue(account);
		loadMailAddr(account);
		loadWeixinAddr(account);
		loadWebchatAddr(account);
		loadTwowayCall(account);
		return account;
	}

	public static void loadAccountInfo(C5Account account) {
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/" + account.getAccount());
			ConfPeer peer = conf.getPeer(account.getAccount());
			if (peer != null) {
				if (peer.contain(Fields.Investigate))
					account.setInvestigateMusicFile(peer
							.getParam(Fields.Investigate));
				if (peer.contain(Fields.Name)){
					account.setName(peer.getParam(Fields.Name));
				}
				if (peer.contain(Fields.PhonebarConfigKey)){
					account.setPhonebarConfig(peer.getParam(Fields.PhonebarConfigKey));
				}
				if (peer.contain(Fields.MaxIncomingCalls)) {
					account.getLisence().setMaxIncomingCalls(Integer.valueOf(peer.getParam(Fields.MaxIncomingCalls)));
				}
				
				if (peer.contain(Fields.MaxOutboundCalls)) {
					account.getLisence().setMaxOutboundCalls(Integer.valueOf(peer.getParam(Fields.MaxOutboundCalls)));
				}
				
				if (peer.contain(Fields.AutoCallStrategy)) {
					account.getLisence().setAutoCallStrategy(peer.getParam(Fields.AutoCallStrategy));
				}
				
				if (peer.contain(Fields.SmartAutoCallCount)) {
					account.getLisence().setSmartAutoCallCount(Integer.valueOf(peer.getParam(Fields.SmartAutoCallCount)));
				}
			}

			// Aman zhai. 2010.05.10 
			ConfPeer peerExten = conf.getPeer(Fields.ExtenFields);
			if (null != peerExten)
				account.setExtenFields(peerExten.getParams());
			
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	/**
	 * In the return hashtable userName is the key value;
	 * 
	 * @param pbx
	 * @param accountId
	 * @return
	 */
	public static Hashtable<String, User> loadUser(C5Account account) {
		Hashtable<String, User> users = new Hashtable<String, User>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + USERS);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					String id = p.getParam(Fields.id);
					User user = new User(account.getPbx(),
							account.getAccount(), id);
					user.setUser(p.getName());
					user.setValues(p.getParams());
					users.put(id, user);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setUsers(users);
		return users;
	}

	public static Hashtable<String, C5Queue> loadQueue(C5Account account) {
		Hashtable<String, C5Queue> queues = new Hashtable<String, C5Queue>();
		try {
			File file = new File(ASConfig.getInstance().getConfigPath() + "/"
					+ account.getPbx() + "/accounts/" + account.getAccount()
					+ "/" + QUEUES);
			if (file.exists()) {
				BufferedReader br = new BufferedReader(new InputStreamReader
						(new FileInputStream(file), "UTF-8"));
				String line = null;
				C5Queue queue = null;
				while ((line = br.readLine()) != null) {
					if (line.startsWith("[")) {
						String exten = line.substring(1, line.length() - 1);
						queue = new C5Queue(account.getPbx(), account
								.getAccount(), exten);
						queues.put(exten, queue);
					} else if (line.startsWith(C5Queue.RETRY)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setRetry(Integer.valueOf(a[1].trim()));
					} else if (line.startsWith(C5Queue.SERVICE_LEVEL)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setServiceLevel(Integer.valueOf(a[1].trim()));
					} else if (line.startsWith(C5Queue.MUSICCLASS)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setMusicclass(a[1].trim());
					} else if (line.startsWith(C5Queue.STRATEGY)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setStrategy(a[1].trim());
					} else if (line.startsWith(C5Queue.MONITOR_JOIN)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setMonitorJoin(a[1].trim().equalsIgnoreCase(
									"yes"));
					} else if (line.startsWith(C5Queue.MONITOR_FORMAT)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setMonitorFormat(a[1].trim());
					} else if (line.startsWith(C5Queue.EVENT_MEMBER_STATUS)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setEventMemberStatus(a[1].trim()
									.equalsIgnoreCase("yes"));
					} else if (line.startsWith(C5Queue.EVENT_WHEN_CALLED)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setEventWhenCalled(a[1].trim()
									.equalsIgnoreCase("yes"));
					} else if (line.startsWith(C5Queue.SAY_EXTEN)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setSayExten(a[1].trim().equalsIgnoreCase(
									"yes"));
					} else if (line.startsWith(C5Queue.AGENT_EXTEN_POINT)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setAgentExtenPoint(a[1].trim().equalsIgnoreCase(
									"yes"));
					} else if (line.startsWith(C5Queue.RING_IN_USE)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setRingInuse(a[1].trim().equalsIgnoreCase(
									"yes"));
					} else if (line.startsWith(C5Queue.TIMEOUT)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setTimeout(Integer.valueOf(a[1].trim()));
					} else if (line.startsWith(C5Queue.WRAP_UP_TIME)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setWrapUpTime(Integer.valueOf(a[1].trim()));
					} else if (line.startsWith(C5Queue.WAIT_TIME)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setWaitTime(Integer.valueOf(a[1].trim()));
					} else if (line
							.startsWith(C5Queue.TO_PEER_WHEN_WAIT_TIMEOUT)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setToPeerWhenWaitTimeout(a[1].trim());
					} else if (line.startsWith(C5Queue.DISPLAY_NAME)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setDisplayName(a[1].trim());
					} else if (line.startsWith(C5Queue.TO_PEER_WHEN_HANGUPED)) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setToPeerWhenHanguped(a[1].trim());
					} else if (line
							.startsWith(C5Queue.TO_PEER_WHEN_QUEUE_EMPTY)) {
						String[] a = line.split("=");
						if (queue != null) {
							queue.setToPeerWhenQueueEmpty(a[1].trim());
						}

					} else if (line.startsWith(Fields.Members)) {
						String[] a = line.split("=");
						if (queue != null) {
							String[] b = a[1].trim().split(",");
							for (int i = 0; i < b.length; i++) {
								String name = b[i];
								String penalty = "0";
								if (b[i].indexOf(':') != -1) {
									String[] c = b[i].split(":");
									name = c[0];
									penalty = c[1];
								}
								queue.addMember(name, penalty);
							}
						}
					} else if (line.startsWith("member=")) {
						String[] a = line.split("=>");
						if (queue != null) {
							String b = a[1].trim().replaceAll("SIP/", "");
							queue.addLocalMember(b);
						}
					} else if (line.startsWith("announceMusic=")) {
						String[] a = line.split("=");
						if (queue != null)
							queue.setAnnounceMusic(a[1].trim());
					}else if (line.startsWith(C5Queue.JOIN_EMPTY)) {
						String[] a = line.split("=");
						if (queue != null) {
							String joinEmpty = a[1].trim();
							if (joinEmpty.equalsIgnoreCase("strict")) {
								queue.setJoinEmpty(true);
							} else {
								queue.setJoinEmpty(false);
							}
						}
					}else if(line.startsWith(C5Queue.SAY_QUEUE_POSITION)){
						String[] a = line.split("=");
						if (queue != null) {
							queue.setSayQueuePostion(a[1].trim());
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		account.setQueues(queues);
		return queues;
	}

	public static Hashtable<String, SipPeer> loadSipPeer(C5Account account) {
		Hashtable<String, SipPeer> peers = new Hashtable<String, SipPeer>();
		try {
			File file = new File(ASConfig.getInstance().getConfigPath() + "/"
					+ account.getPbx() + "/accounts/" + account.getAccount()
					+ "/" + SIP);
			if (file.exists()) {
				BufferedReader br = new BufferedReader(new FileReader(file));
				String line = null;
				SipPeer peer = null;
				while ((line = br.readLine()) != null) {
					if (line.startsWith("[")) {
						String exten = line.substring(1, line.length() - 1);
						peer = new SipPeer(account.getPbx(), account
								.getAccount(), exten);
						peer.removeAllAllowAudioCodec();
						peers.put(exten, peer);
					} else if (peer != null) {
						String[] a = line.split("=");
						if (a.length == 1) {
							a = new String[] { a[0].trim(), "" };
						}
						if (line.startsWith("type")) {
							peer.setType(a[1].trim());
						} else if (line.startsWith("secret")) {
							peer.setSecret(a[1].trim());
						} else if (line.startsWith("host")) {
							peer.setHost(a[1].trim());
						} else if (line.startsWith("nat")) {
							peer.setNat(a[1].trim().equalsIgnoreCase("yes"));
						} else if (line.startsWith("canreinvite")) {
							peer.setCanreinvite(a[1].trim().equalsIgnoreCase(
									"yes"));
						} else if (line.startsWith("call-limit")) {
							peer.setCall_limit(Integer.valueOf(a[1].trim()));
						} else if (line.startsWith("qualify")) {
							peer
									.setQualify(a[1].trim().equalsIgnoreCase(
											"yes"));
						} else if (line.startsWith("context")) {
							peer.setContext(a[1].trim());
						} else if (line.startsWith("callerid")) {
							peer.setName(a[1].trim());
						} else if (line.startsWith("allow")) {
							peer.addAllowAudioCodec(a[1].trim());
						} else if (line.startsWith("c5local")) {
							peer.setLocal(a[1].trim().equalsIgnoreCase("yes"));
						} else if (line.startsWith("port")) {
							peer.setPort(a[1].trim());
						} else if (line.startsWith("fromuser")) {
							peer.setFromuser(a[1].trim());
						} else if (line.startsWith("username")) {
							peer.setUsername(a[1].trim());
						} else if (line.startsWith("localnum")) {
							peer.setLocalNum(a[1].trim());
						} else if (line.startsWith(Fields.ExtenType)) {
							peer.setExtenType(a[1].trim());
						} else if (a[0].equals("c5user")) {
							peer.setUserID(a[1].trim());
							peer.setUser(account.getUser(peer.getUserID()));
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		account.setSipPeer(peers);
		return peers;
	}

	public static Hashtable<String, ServiceNo> loadServiceNo(C5Account account) {
		Hashtable<String, ServiceNo> sns = new Hashtable<String, ServiceNo>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + SERVICE_NO);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					ServiceNo sn = new ServiceNo(account.getPbx(), account
							.getAccount(), p.getName());
					sn.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						sn.setDisplayName(p.getParam(Fields.DisplayName));
					if (p.contain(Fields.Type))
						sn.setType(p.getParam(Fields.Type));
					sns.put(sn.getExten(), sn);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setServiceNo(sns);
		return sns;
	}

	public static Hashtable<String, BlackList> loadBlackList(C5Account account) {
		Hashtable<String, BlackList> bls = new Hashtable<String, BlackList>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + BLACK_LIST);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					BlackList bl = new BlackList(account.getPbx(), account.getAccount(), p.getName());
					bl.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						bl.setDisplayName(p.getParam(Fields.DisplayName));
					bls.put(bl.getExten(), bl);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setBlackList(bls);
		return bls;
	}
	

	public static Hashtable<String, List<String>> loadNum(C5Account account) {
		Hashtable<String, List<String>> nums = new Hashtable<String, List<String>>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + NUMS);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
					for (int i = 0; i < peers.length; i++) {
						ConfPeer p = peers[i];
						List<String> list=new ArrayList<String>();
						if(p.getParams().values() != null && p.getParams().values().size() > 0){
							for(String s:p.getParams().values()){
								if(!s.equals("")){
									String strs[]=s.split(",");
									for(String n:strs){
										list.add(n);
									}
									break;
								}
							}
						}
						nums.put(p.getName(),list);
					}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setNums(nums);
		return nums;
	}

	public static Hashtable<String, TimeCondition> loadTimeCondition(
			C5Account account) {
		Hashtable<String, TimeCondition> tcs = new Hashtable<String, TimeCondition>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + TIME_CONDITION);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					TimeCondition tc = new TimeCondition(account.getPbx(),
							account.getAccount(), p.getName());
					tc.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						tc.setDisplayName(p.getParam(Fields.DisplayName));
					tcs.put(tc.getExten(), tc);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setTimeCondition(tcs);
		return tcs;
	}

	// Aman zhai. 2010.07.25
	public static Hashtable<String, AssignmentNode> loadAssignmentNodes(
			C5Account account) {
		Hashtable<String, AssignmentNode> assignmentNodes = new Hashtable<String, AssignmentNode>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + ASSIGNMENT);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					AssignmentNode assignmentNode = new AssignmentNode(account
							.getPbx(), account.getAccount(), p.getName());
					assignmentNode.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						assignmentNode.setDisplayName(p
								.getParam(Fields.DisplayName));
					assignmentNodes.put(assignmentNode.getExten(),
							assignmentNode);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setAssignmentNodes(assignmentNodes);
		return assignmentNodes;
	}

	public static Hashtable<String, DialJobNumNode> loadDialJobNumNodes(
			C5Account account) {
		Hashtable<String, DialJobNumNode> dialJobNumNodes = new Hashtable<String, DialJobNumNode>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + DIALJOBNUM);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					DialJobNumNode dialJobNumNode = new DialJobNumNode(account
							.getPbx(), account.getAccount(), p.getName());
					dialJobNumNode.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						dialJobNumNode.setDisplayName(p
								.getParam(Fields.DisplayName));
					dialJobNumNodes.put(dialJobNumNode.getExten(),
							dialJobNumNode);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setDialJobNumNodes(dialJobNumNodes);
		return dialJobNumNodes;
	}
	//add by chengguang 2012-11-8-----------------------------
	public static Hashtable<String, IvrValidateNode> loadIvrValidateNodes(
			C5Account account) {
		Hashtable<String, IvrValidateNode> ivrValidateNodes = new Hashtable<String, IvrValidateNode>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + IVRVALIDATE);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					IvrValidateNode ivrValidateNode = new IvrValidateNode(account
							.getPbx(), account.getAccount(), p.getName());

					if (p.contain(Fields.DisplayName))
						ivrValidateNode.setDisplayName(p
								.getParam(Fields.DisplayName));
					ivrValidateNodes.put(ivrValidateNode.getExten(),
							ivrValidateNode);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setIvrValidateNodes(ivrValidateNodes);
		return ivrValidateNodes;
	}

	// <--

	// Aman zhai. 2010.06.11
	public static Hashtable<String, DynamicRouteNode> loadDynamicRouteNodes(
			C5Account account) {
		Hashtable<String, DynamicRouteNode> dynamicRouteNodes = new Hashtable<String, DynamicRouteNode>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + DYNAMICROUTE);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					DynamicRouteNode dynamicRouteNode = new DynamicRouteNode(
							account.getPbx(), account.getAccount(), p.getName());
					dynamicRouteNode.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						dynamicRouteNode.setDisplayName(p
								.getParam(Fields.DisplayName));
					dynamicRouteNodes.put(dynamicRouteNode.getExten(),
							dynamicRouteNode);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setDynamicRouteNodes(dynamicRouteNodes);
		return dynamicRouteNodes;
	}

	// Aman zhai. 2010.06.09
	public static Hashtable<String, DialextenNode> loadDialextenNodes(
			C5Account account) {
		Hashtable<String, DialextenNode> dialextenNodes = new Hashtable<String, DialextenNode>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + DIALEXTEN);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					DialextenNode dialextenNode = new DialextenNode(account
							.getPbx(), account.getAccount(), p.getName());
					dialextenNode.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						dialextenNode.setDisplayName(p
								.getParam(Fields.DisplayName));

					dialextenNodes.put(dialextenNode.getExten(), dialextenNode);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setDialextenNodes(dialextenNodes);
		return dialextenNodes;
	}

	// <--

	public static Hashtable<String, IVR> loadIVR(C5Account account) {
		Hashtable<String, IVR> ivrs = new Hashtable<String, IVR>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + IVR);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					IVR ivr = new IVR(account.getPbx(), account.getAccount(), p
							.getName());
					ivr.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						ivr.setDisplayName(p.getParam(Fields.DisplayName));

					ivrs.put(ivr.getExten(), ivr);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setIVR(ivrs);
		return ivrs;
	}

	public static Hashtable<String, CallUrl> loadCallUrl(C5Account account) {
		Hashtable<String, CallUrl> callUrls = new Hashtable<String, CallUrl>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + CALL_URL_CONF);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					CallUrl callUrl = new CallUrl(account.getPbx(), account
							.getAccount(), p.getName());
					callUrl.setValue(p.getParams());

					callUrls.put(callUrl.getExten(), callUrl);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setCallUrl(callUrls);
		return callUrls;
	}
	
	public static Hashtable<String, TwowayCall> loadTwowayCall(C5Account account) {
		Hashtable<String, TwowayCall> twowayCalls = new Hashtable<String, TwowayCall>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + TWOWAY_CALL_CONF);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					TwowayCall twowayCall = new TwowayCall(account.getPbx(), account
							.getAccount(), p.getName());
					twowayCall.setValue(p.getParams());

					twowayCalls.put(twowayCall.getExten(), twowayCall);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setTwowayCall(twowayCalls);
		return twowayCalls;
	}
	
	public static Hashtable<String, TextAnnouncement> loadTextAnnouncement(C5Account account) {
		Hashtable<String, TextAnnouncement> textAnnouncements = new Hashtable<String, TextAnnouncement>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + TEXT_ANNOUNCEMENT_CONF);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					TextAnnouncement textAnnouncement = new TextAnnouncement(account.getPbx(), account
							.getAccount(), p.getName());
					textAnnouncement.setValue(p.getParams());

					textAnnouncements.put(textAnnouncement.getExten(), textAnnouncement);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setTextAnnouncement(textAnnouncements);
		return textAnnouncements;
	}
	
	public static Hashtable<String, EncryptMD5> loadEncryptMD5(C5Account account) {
		Hashtable<String, EncryptMD5> encryptMD5s = new Hashtable<String, EncryptMD5>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + ENCRYPT_MD5_CONF);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					EncryptMD5 encryptMD5 = new EncryptMD5(account.getPbx(), account
							.getAccount(), p.getName());
					encryptMD5.setValue(p.getParams());

					encryptMD5s.put(encryptMD5.getExten(), encryptMD5);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setEncryptMD5(encryptMD5s);
		return encryptMD5s;
	}
	
	public static Hashtable<String, Room> loadRoom(C5Account account) {
		Hashtable<String, Room> rooms = new Hashtable<String, Room>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + ROOM_CONF);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					Room room = new Room(account.getPbx(), account
							.getAccount(), p.getName());
					room.setValue(p.getParams());

					rooms.put(room.getExten(), room);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setRoom(rooms);
		return rooms;
	}

	public static Hashtable<String, Satisfaction> loadSatisfaction(
			C5Account account) {
		Hashtable<String, Satisfaction> ants = new Hashtable<String, Satisfaction>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + SATISFACTION);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					Satisfaction ant = new Satisfaction(account.getPbx(),
							account.getAccount(), p.getName());
					ant.setValues(p.getParams());
					if (p.contain(Fields.DisplayName))
						ant.setDisplayName(p.getParam(Fields.DisplayName));

					ants.put(ant.getExten(), ant);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setSatisfactions(ants);
		return ants;
	}
	
	public static Hashtable<String, SuperDialJobNum> loadSuperDialJobNum(
			C5Account account) {
		Hashtable<String, SuperDialJobNum> ants = new Hashtable<String, SuperDialJobNum>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + SUPERDIALJOBNUM);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					SuperDialJobNum ant = new SuperDialJobNum(account.getPbx(),
							account.getAccount(), p.getName());
					ant.setValues(p.getParams());
					if (p.contain(Fields.DisplayName))
						ant.setDisplayName(p.getParam(Fields.DisplayName));

					ants.put(ant.getExten(), ant);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setSuperDialJobNum(ants);
		return ants;
	}
	
	public static Hashtable<String, IvrMenu> loadIvrMenu(
			C5Account account) {
		Hashtable<String, IvrMenu> ants = new Hashtable<String, IvrMenu>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + IVRMENU);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					IvrMenu ant = new IvrMenu(account.getPbx(),
							account.getAccount(), p.getName());
					ant.setValues(p.getParams());
					if (p.contain(Fields.DisplayName))
						ant.setDisplayName(p.getParam(Fields.DisplayName));
					ants.put(ant.getExten(), ant);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setIvrMenus(ants);
		return ants;
	}
	public static Hashtable<String, Announcement> loadAnnouncement(
			C5Account account) {
		Hashtable<String, Announcement> ants = new Hashtable<String, Announcement>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + ANNOUNCEMENT);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					Announcement ant = new Announcement(account.getPbx(),
							account.getAccount(), p.getName());
					ant.setValues(p.getParams());
					if (p.contain(Fields.DisplayName))
						ant.setDisplayName(p.getParam(Fields.DisplayName));

					ants.put(ant.getExten(), ant);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setAnnouncement(ants);
		return ants;
	}



	private static Hashtable<String, SwitchBoard> loadSwitchBoard(C5Account account) {
		Hashtable<String, SwitchBoard> switchBoards = new Hashtable<String, SwitchBoard>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + SWITCH_BOARD);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					SwitchBoard switchBoard = new SwitchBoard(account.getPbx(),
							account.getAccount(), p.getName());
					switchBoard.setValues(p.getParams());
					switchBoards.put(switchBoard.getExten(), switchBoard);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setSwitchBoard(switchBoards);
		return switchBoards;
		
	}
	
	public static Hashtable<String, Validation> loadValidate(C5Account account) {
		Hashtable<String, Validation> ants = new Hashtable<String, Validation>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + VALIDATE);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					Validation ant = new Validation(account.getPbx(), account
							.getAccount(), p.getName());
					ant.setValues(p.getParams());
					if (p.contain(Fields.DisplayName))
						ant.setDisplayName(p.getParam(Fields.DisplayName));

					ants.put(ant.getExten(), ant);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setValidate(ants);
		return ants;
	}

	public static Hashtable<String, Voicemail> loadVoicemail(C5Account account) {
		Hashtable<String, Voicemail> ants = new Hashtable<String, Voicemail>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + VOICEMAIL);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					Voicemail ant = new Voicemail(account.getPbx(), account
							.getAccount(), p.getName());
					ant.setValues(p.getParams());
					if (p.contain(Fields.DisplayName))
						ant.setDisplayName(p.getParam(Fields.DisplayName));

					ants.put(ant.getExten(), ant);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setVoicemail(ants);
		return ants;
	}

	public static Hashtable<String, ExtensionPeer> loadExtensionPeer(
			C5Account account) {
		Hashtable<String, ExtensionPeer> ants = new Hashtable<String, ExtensionPeer>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + EXTENSION_PEER);
			ConfPeer[] peers = conf.getAllPeers();
			JSONReader jr = new JSONReader();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					ExtensionPeer ant = new ExtensionPeer(account.getPbx(),
							account.getAccount(), p.getName());
					ant.setDialplan((String) jr.read(p
							.getParam(Fields.DialPlan)));
					if (p.contain(Fields.DisplayName))
						ant.setDisplayName(p.getParam(Fields.DisplayName));

					ants.put(ant.getExten(), ant);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		account.setExtensionPeer(ants);
		return ants;
	}

	public static Hashtable<String, HoldMusic> loadHoldMusic(C5Account account) {
		Hashtable<String, HoldMusic> hms = new Hashtable<String, HoldMusic>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/" + MOH);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					HoldMusic hm = new HoldMusic(account.getPbx(), account
							.getAccount(), p.getName());

					hms.put(hm.getName(), hm);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setHoldMusic(hms);
		return hms;
	}

	public static DialLine loadDialoutLine(C5Account account) {
		DialLine line = null;
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + DIALOUT_LINE);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					line = new DialLine(account.getPbx(), account.getAccount(),
							p.getName());
					if (p.contain(Fields.DisplayName))
						line.setDisplayName(p.getParam(Fields.DisplayName));

					line.setValue(p.getParams());
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setDialoutLine(line);
		return line;
	}

	public static DialLine loadXferLine(C5Account account) {
		DialLine line = null;
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + XFER_LINE);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					line = new DialLine(account.getPbx(), account.getAccount(),
							p.getName());
					if (p.contain(Fields.DisplayName))
						line.setDisplayName(p.getParam(Fields.DisplayName));

					line.setValue(p.getParams());
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setXferLine(line);
		return line;
	}

	public static RedList loadRedList(C5Account account) {
		RedList redlist = null;
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + RED_LIST);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					redlist = new RedList(account.getPbx(), account.getAccount(),
							p.getName());
					if (p.contain(Fields.List))
						redlist.setList(p.getParam(Fields.List));
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setRedList(redlist);
		return redlist;
	}
	/**
	 * In this method we will create all default configuration files for this
	 * account in the identified PBX. Configuration files include: 1. emp_no
	 * This file records the relationship of extension and employee's number; 2.
	 * account This file records login name and password; 3. extensions.ael
	 * Dialplan configuration file; 4. ivr.ael IVR configuration file; 5.
	 * queues.conf Configuration file of queue; 6. sip.conf Configuration file
	 * of sip extension;
	 * 
	 * @param action
	 * @return
	 */
	public synchronized static void addAccount(String pbx, String account)
			throws Exception {
		File dir = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account);
		if (!dir.exists())
			dir.mkdirs();

		File _account = new File(ASConfig.getInstance().getConfigPath() + "/"
				+ pbx + "/accounts/" + account + "/" + account);
		if (!_account.exists())
			_account.createNewFile();

		// updateAccount(a);

		File queues = new File(ASConfig.getInstance().getConfigPath() + "/"
				+ pbx + "/accounts/" + account + "/" + QUEUES);
		if (!queues.exists())
			queues.createNewFile();

		File sip = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/" + SIP);
		if (!sip.exists())
			sip.createNewFile();

		File modConf = new File(ASConfig.getInstance().getConfigPath() + "/"
				+ pbx + "/accounts/" + account + "/" + MOH);
		if (!modConf.exists())
			modConf.createNewFile();

		File conf = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/" + CONF);
		if (!conf.exists())
			conf.mkdir();

		File sound = new File(ASConfig.getInstance().getConfigPath() + "/"
				+ pbx + "/accounts/" + account + "/" + SOUND);
		if (!sound.exists())
			sound.mkdir();

		File mod = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/" + "moh");
		if (!mod.exists())
			mod.mkdir();

		File agi = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/" + AGI);
		if (!agi.exists())
			agi.mkdir();
	}

	public static boolean removeAccount(String pbx, String account) {
		File dir = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account);
		if (dir.exists()) {
			deleteFile(dir);
		}
		return true;
	}

	public static void deleteFile(File file) {
		if (file.isFile()) {
			file.delete();
			return;
		} else {
			File[] files = file.listFiles();
			if (files.length == 0) {
				file.delete();
				return;
			} else {
				for (int i = 0; i < files.length; i++) {
					deleteFile(files[i]);
				}
			}
		}
		file.delete();
	}

	public static boolean updateUsers(String pbx, String account,
			Hashtable<String, User> users) {
		File _account = new File(ASConfig.getInstance().getConfigPath() + "/"
				+ pbx + "/accounts/" + account + "/conf/" + USERS);
		if (!_account.exists())
			try {
				_account.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create account file failed", e);
				return false;
			}
		String data = "";
		Iterator<User> keys = users.values().iterator();
		while (keys.hasNext()) {
			User user = keys.next();
			data += user.getConfigString() + "\r\n";
		}
		try {
			Writer fw = new BufferedWriter(new OutputStreamWriter(
					new FileOutputStream(_account), "UTF-8"));
			fw.write(data);
			fw.flush();
			fw.close();
		} catch (IOException e) {
			log.log(Level.WARNING, "Update account file failed", e);
			return false;
		}
		return true;
	}

	/**
	 * [21003845] type=friend secret=0d714ed3 host=dynamic nat=yes
	 * canreinvite=no call-limit=1 qualify=yes context=P000000003598
	 * callerid="21003845"<21003845> disallow=all allow=speex allow=g729
	 * allow=gsm
	 * 
	 * @param account
	 * @param pbx
	 * @param peers
	 * @return
	 */
	public static boolean updateSip(String account, String pbx,
			Hashtable<String, SipPeer> peers) {
		File sip = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/" + SIP);
		if (!sip.exists())
			try {
				sip.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create sip.conf file failed", e);
				return false;
			}
		String data = "";
		Iterator<SipPeer> sipPeers = peers.values().iterator();
		while (sipPeers.hasNext()) {
			SipPeer peer = sipPeers.next();
			data += SipTemplate.create(peer) + "\r\n";
		}
		try {
			FileWriter fw = new FileWriter(sip);
			fw.write(data);
			fw.flush();
			fw.close();
		} catch (IOException e) {
			log.log(Level.WARNING, "Write sip.conf file failed", e);
			return false;
		}

		return true;
	}

	/**
	 * [592424090] retry=3 musicclass=default strategy=rrmemory monitor-join=no
	 * monitor-format=wav eventmemberstatus=yes eventwhencalled=yes ringinuse=no
	 * joinempty=yes wrapuptime=3 timeout=15
	 * 
	 * @param account
	 * @param pbx
	 * @param queues
	 * @return
	 */
	public static boolean updateQueue(String account, String pbx,
			Hashtable<String, C5Queue> queues) {
		File file = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/" + QUEUES);
		if (!file.exists())
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create queues.conf file failed", e);
				return false;
			}
		String data = "";
		Iterator<C5Queue> _queues = queues.values().iterator();
		while (_queues.hasNext()) {
			C5Queue queue = _queues.next();
			data += queue.getConfigString();
			data += "\r\n";
		}
		try {
			Writer fw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file), "UTF-8"));
			fw.write(data);
			fw.flush();
			fw.close();
		} catch (IOException e) {
			log.log(Level.WARNING, "Write queues.conf file failed", e);
			return false;
		}
		return true;
	}

	public static boolean updateServiceNo(String pbx, String account,
			Hashtable<String, ServiceNo> sns) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + SERVICE_NO;

		Configure config = new Configure(fileName);
		Iterator<ServiceNo> serviceNos = sns.values().iterator();
		while (serviceNos.hasNext()) {
			ServiceNo sn = serviceNos.next();
			ConfPeer peer = new ConfPeer(sn.getExten());
			if (sn.getType() != null)
				peer.addParam(Fields.Type, sn.getType());
			if (sn.getToPeer() != null)
				peer.addParam(Fields.ToPeer, sn.getToPeer());
			if (sn.getWelcomeMusic() != null)
				peer.addParam(Fields.Filename, sn.getWelcomeMusic()
						.getMusicFile());
			if (sn.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, sn.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean updateHoldMusic(String pbx, String account,
			Hashtable<String, HoldMusic> holdMusic) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/" + MOH;
		Configure config = new Configure(fileName);
		Iterator<HoldMusic> hms = holdMusic.values().iterator();
		while (hms.hasNext()) {
			HoldMusic hm = hms.next();
			ConfPeer peer = new ConfPeer(hm.getName());
			peer.addParam("mode", "files");
			peer.addParam("directory", ASConfig.getInstance().getConfigPath()
					+ "/" + pbx + "/accounts/" + account + "/moh/"
					+ hm.getName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean updateTimeCondition(String pbx, String account,
			Hashtable<String, TimeCondition> timeConditions) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + TIME_CONDITION;

		Configure config = new Configure(fileName);
		Iterator<TimeCondition> tcs = timeConditions.values().iterator();
		while (tcs.hasNext()) {
			TimeCondition tc = tcs.next();
			ConfPeer peer = new ConfPeer(tc.getExten());
			String times = "";
			for (int i = 0; i < tc.getItems().size(); i++) {
				times += tc.getItems().get(i).getConditionString() + "@";
			}
			if (times.endsWith("@"))
				times = times.substring(0, times.length() - 1);
			peer.addParam(Fields.Times, times);
			if (tc.getMatchedPeer() != null)
				peer.addParam(Fields.MatchedPeer, tc.getMatchedPeer());
			if (tc.getUnmatchedPeer() != null)
				peer.addParam(Fields.UnmatchedPeer, tc.getUnmatchedPeer());
			if (tc.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, tc.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean updateBlackList(String pbx, String account,
			Hashtable<String, BlackList> blacklist) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + BLACK_LIST;
		Configure config = new Configure(fileName);
		Iterator<BlackList> bls = blacklist.values().iterator();
		while (bls.hasNext()) {
			BlackList bl = bls.next();
			ConfPeer peer = new ConfPeer(bl.getExten());
			peer.addParam(Fields.Style, "" + bl.getStyle());
			if (bl.getBlackListNumbers().size() > 0) {
				String list = "";
				for (int i = 0; i < bl.getBlackListNumbers().size(); i++) {
					String number = bl.getBlackListNumbers().get(i);
					if (number.trim().equalsIgnoreCase(""))
						continue;
					list += number.trim() + ",";
				}
				if (list.endsWith(",")) {
					list = list.substring(0, list.length() - 1);
					peer.addParam(Fields.List, list);
				}
			}
			if (bl.getExpression() != null)
				peer.addParam(Fields.Expression, bl.getExpression());
			if (bl.getMatchedPeer() != null)
				peer.addParam(Fields.MatchedPeer, bl.getMatchedPeer());
			if (bl.getUnmatchedPeer() != null)
				peer.addParam(Fields.UnmatchedPeer, bl.getUnmatchedPeer());
			if (bl.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, bl.getDisplayName());

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static boolean updateRedList(String pbx, String account,
			RedList redlist) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + RED_LIST;
		Configure config = new Configure(fileName);

		ConfPeer peer = new ConfPeer(redlist.getExten());
		peer.addParam(Fields.List, redlist.getList());

		config.addPeer(peer);
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean updateNum(String pbx, String account,
			Hashtable<String, List<String>> nums) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + NUMS;
		Configure config = new Configure(fileName);
		Set<String> numTypeSet = nums.keySet();
		List<String> numList = null;
		String t = "";
		for(String type : numTypeSet){
			numList = nums.get(type);
			ConfPeer peer = new ConfPeer(type);
			t = "";
			for(String s : numList){
				t += s +",";
			}
			if(t.length()>0){
				t = t.substring(0, t.length() - 1);
			}
			peer.addParam(Fields.Num, t);
			config.addPeer(peer);
		}
		
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean updateAssignmentNodes(String pbx, String account,
			Hashtable<String, AssignmentNode> assignmentNodes) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + ASSIGNMENT;
		Configure config = new Configure(fileName);
		Iterator<AssignmentNode> bls = assignmentNodes.values().iterator();
		while (bls.hasNext()) {
			AssignmentNode assignmentNode = bls.next();
			ConfPeer peer = new ConfPeer(assignmentNode.getExten());

			peer.addParam(Fields.SetVar, assignmentNode.constructItemsString());
			peer.addParam(Fields.ToPeer, assignmentNode.getToPeer());

			if (assignmentNode.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, assignmentNode
						.getDisplayName());

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean updateDialJobNumNodes(String pbx, String account,
			Hashtable<String, DialJobNumNode> dialJobNumNodes) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + DIALJOBNUM;
		Configure config = new Configure(fileName);
		Iterator<DialJobNumNode> bls = dialJobNumNodes.values().iterator();
		while (bls.hasNext()) {
			DialJobNumNode dialJobNumNode = bls.next();
			ConfPeer peer = new ConfPeer(dialJobNumNode.getExten());

			peer.addParam(Fields.ToPeer, dialJobNumNode.getToPeerNotExist());
			peer.addParam(Fields.DialJobNumParam, dialJobNumNode.getParam());
			peer.addParam(Fields.AgentBusyToPeer, dialJobNumNode.getToPeerAgentBusy());
			peer.addParam(Fields.LogoffToPeer, dialJobNumNode.getToPeerLogoff());

			if (dialJobNumNode.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, dialJobNumNode
						.getDisplayName());

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	//add by chenguang 
	public static boolean updateIvrValidates(String pbx, String account,
			Hashtable<String, IvrValidateNode> ivrValidateNodes) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + IVRVALIDATE;
		Configure config = new Configure(fileName);
		Iterator<IvrValidateNode> bls = ivrValidateNodes.values().iterator();
		
		while (bls.hasNext()) {
			IvrValidateNode ivrValidateNode = bls.next();
			ConfPeer peer = new ConfPeer(ivrValidateNode.getExten());

			peer.addParam(Fields.ValidateToPeer, ivrValidateNode.getValidateToPeer());
			//peer.addParam(Fields.IvrValidateParam, ivrValidateNode.getParam());

			if (ivrValidateNode.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, ivrValidateNode.getDisplayName());

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	// Aman zhai. 2010.06.11
	public static boolean updateDynamicRouteNodes(String pbx, String account,
			Hashtable<String, DynamicRouteNode> dynamicRouteNodes)
			throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + DYNAMICROUTE;
		Configure config = new Configure(fileName);
		Iterator<DynamicRouteNode> bls = dynamicRouteNodes.values().iterator();
		while (bls.hasNext()) {
			DynamicRouteNode dynamicRouteNode = bls.next();
			ConfPeer peer = new ConfPeer(dynamicRouteNode.getExten());

			peer.addParam(Fields.RouteRules, dynamicRouteNode
					.getRouteRulesString());
			if (null != dynamicRouteNode.getConjunctionsString())
				peer.addParam(Fields.Conjunctions, dynamicRouteNode
						.getConjunctionsString());
			else peer.addParam(Fields.Conjunctions, "");
			peer.addParam(Fields.ToPeerUnmatched, dynamicRouteNode
					.getToPeerUnmatched());
			if (dynamicRouteNode.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, dynamicRouteNode
						.getDisplayName());

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	// <--

	// Aman zhai. 2010.06.09
	public static boolean updateDialextenNodes(String pbx, String account,
			Hashtable<String, DialextenNode> dialextenNodes) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + DIALEXTEN;
		Configure config = new Configure(fileName);
		Iterator<DialextenNode> bls = dialextenNodes.values().iterator();
		while (bls.hasNext()) {
			DialextenNode dialextenNode = bls.next();
			ConfPeer peer = new ConfPeer(dialextenNode.getExten());
			if (dialextenNode.getMusic() != null)
				peer.addParam(Fields.Filename, dialextenNode.getMusic()
						.getMusicFile());

			peer.addParam(Fields.Timeout, dialextenNode.getTimeout() + "");
			peer.addParam(Fields.ExtenLen, dialextenNode.getExtenLen() + "");

			if (dialextenNode.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, dialextenNode
						.getDisplayName());

			if (!"".equals(dialextenNode.getToPeerWhenTimeout())
					&& null != dialextenNode.getToPeerWhenTimeout())
				peer.addParam(Fields.ToPeerWhenTimeout, dialextenNode
						.getToPeerWhenTimeout());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	// <--

	public static boolean updateIVR(String pbx, String account,
			Hashtable<String, IVR> ivrs) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + IVR;
		Configure config = new Configure(fileName);
		Iterator<IVR> bls = ivrs.values().iterator();
		while (bls.hasNext()) {
			IVR ivr = bls.next();
			ConfPeer peer = new ConfPeer(ivr.getExten());
			if (ivr.getMusic() != null)
				peer.addParam(Fields.Filename, ivr.getMusic().getMusicFile());
			if (ivr.getIvrKeys().size() > 0) {
				String ivrKey = "";
				for (int i = 0; i < ivr.getIvrKeys().size(); i++) {
					IVRKey key = ivr.getIvrKeys().get(i);
					ivrKey += key.getKey() + "@" + key.getToPeer() + ",";
				}
				if (ivrKey.endsWith(","))
					ivrKey = ivrKey.substring(0, ivrKey.length() - 1);
				peer.addParam(Fields.IvrKey, ivrKey);
			}
			peer.addParam(Fields.Timeout, ivr.getTimeout() + "");
			peer.addParam(Fields.RetryTime, ivr.getRetry_time() + "");

			if (ivr.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, ivr.getDisplayName());

			// Aman zhai. 2010.06.08
			/*
			 * if (null != ivr.getDialextenNode() &&
			 * !"".equals(ivr.getDialextenNode())) {
			 * peer.addParam(Fields.DialextenNode, ivr.getDialextenNode()); }
			 */
			// <--
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean updateCallUrl(String pbx, String account,
			Hashtable<String, CallUrl> callUrls) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + CALL_URL_CONF;
		Configure config = new Configure(fileName);
		Iterator<CallUrl> bls = callUrls.values().iterator();
		while (bls.hasNext()) {
			CallUrl callUrl = bls.next();
			ConfPeer peer = new ConfPeer(callUrl.getExten());
			if (callUrl.getMusic() != null)
				peer.addParam(Fields.Filename, callUrl.getMusic()
						.getMusicFile());
			peer.addParam(Fields.Timeout, callUrl.getTimeout() + "");
			if (callUrl.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, callUrl.getDisplayName());
			if (callUrl.getToPeerWhenTimeout() != null)
				peer.addParam(Fields.ToPeerWhenTimeout, callUrl
						.getToPeerWhenTimeout());
			if (callUrl.getNextPeer() != null) {
				peer.addParam(Fields.NextPeer, callUrl.getNextPeer());
			}
			if (callUrl.getUrl() != null) {
				peer.addParam(Fields.Url, callUrl.getUrl());
			}
			if (callUrl.getMd5Key() != null) {
				peer.addParam(Fields.MD5, callUrl.getMd5Key());
			}
			
			if (callUrl.getVar() != null) {
				peer.addParam(Fields.Variable, callUrl.getVar());
			}

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static boolean updateTwowayCall(String pbx, String account,
			Hashtable<String, TwowayCall> twowayCalls) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + TWOWAY_CALL_CONF;
		Configure config = new Configure(fileName);
		Iterator<TwowayCall> bls = twowayCalls.values().iterator();
		while (bls.hasNext()) {
			TwowayCall twowayCall = bls.next();
			ConfPeer peer = new ConfPeer(twowayCall.getExten());
			if (twowayCall.getMusic() != null)
				peer.addParam(Fields.Filename, twowayCall.getMusic()
						.getMusicFile());
			if (twowayCall.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, twowayCall.getDisplayName());
			
			if (twowayCall.getNextPeer() != null) {
				peer.addParam(Fields.NextPeer, twowayCall.getNextPeer());
			}
			
			if (twowayCall.getVariable() != null) {
				peer.addParam(Fields.Variable, twowayCall.getVariable());
			}

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static boolean updateTextAnnouncement(String pbx, String account,
			Hashtable<String, TextAnnouncement> textAnnouncements) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + TEXT_ANNOUNCEMENT_CONF;
		Configure config = new Configure(fileName);
		Iterator<TextAnnouncement> bls = textAnnouncements.values().iterator();
		while (bls.hasNext()) {
			TextAnnouncement textAnnouncement = bls.next();
			ConfPeer peer = new ConfPeer(textAnnouncement.getExten());
			if(textAnnouncement.getAnnouncementText() != null){
				peer.addParam(Fields.AnnouncementText, textAnnouncement.getAnnouncementText());
			}
			if(textAnnouncement.getWordInterval() != null){
				peer.addParam(Fields.WordInterval, textAnnouncement.getWordInterval());
			}
			if(textAnnouncement.getSignInterval() != null){
				peer.addParam(Fields.SignInterval, textAnnouncement.getSignInterval());
			}
			if(textAnnouncement.getIsMoney() != null){
				peer.addParam(Fields.IsMoney, textAnnouncement.getIsMoney());
			}
			if (textAnnouncement.getNextPeer() != null) {
				peer.addParam(Fields.NextPeer, textAnnouncement.getNextPeer());
			}
			if (textAnnouncement.getDisplayName() != null) {
				peer.addParam(Fields.DisplayName, textAnnouncement.getDisplayName());
			}
			if (textAnnouncement.getEngine() != null) {
				peer.addParam(Fields.Engine, textAnnouncement.getEngine());
			}
			if (textAnnouncement.getSpeed() != null) {
				peer.addParam(Fields.Speed, textAnnouncement.getSpeed());
			}
			if (textAnnouncement.getPitch() != null) {
				peer.addParam(Fields.Pitch, textAnnouncement.getPitch());
			}
			if (textAnnouncement.getVolume() != null) {
				peer.addParam(Fields.Volume, textAnnouncement.getVolume());
			}
			if (textAnnouncement.getVoiceName() != null) {
				peer.addParam(Fields.VoiceName, textAnnouncement.getVoiceName());
			}
			if (textAnnouncement.getReplaceVar() != null) {
				peer.addParam(Fields.ReplaceVar, textAnnouncement.getReplaceVar());
			}
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static boolean updateEncryptMD5(String pbx, String account,
			Hashtable<String, EncryptMD5> encryptMD5s) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + ENCRYPT_MD5_CONF;
		Configure config = new Configure(fileName);
		Iterator<EncryptMD5> bls = encryptMD5s.values().iterator();
		while (bls.hasNext()) {
			EncryptMD5 encryptMD5 = bls.next();
			ConfPeer peer = new ConfPeer(encryptMD5.getExten());
			if(encryptMD5.getEncryptText() != null){
				peer.addParam(Fields.EncryptText, encryptMD5.getEncryptText());
			}
			if(encryptMD5.getVar() != null){
				peer.addParam(Fields.Variable, encryptMD5.getVar());
			}
			if (encryptMD5.getNextPeer() != null) {
				peer.addParam(Fields.NextPeer, encryptMD5.getNextPeer());
			}
			if (encryptMD5.getDisplayName() != null) {
				peer.addParam(Fields.DisplayName, encryptMD5.getDisplayName());
			}
		
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static boolean updateRoom(String pbx, String account,
			Hashtable<String, Room> rooms) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + ROOM_CONF;
		Configure config = new Configure(fileName);
		Iterator<Room> roomIte = rooms.values().iterator();
		Room room = null;
		while (roomIte.hasNext()) {
			room = roomIte.next();
			ConfPeer peer = new ConfPeer(room.getExten());
			if (room.getDisplayName() != null) {
				peer.addParam(Fields.DisplayName, room.getDisplayName());
			}
			if (room.getPassword() != null) {
				peer.addParam(Fields.RoomPassword, room.getPassword());
			}

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static void updateAccount(C5Account account) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/"
				+ account.getPbx() + "/accounts/" + account.getAccount() + "/"
				+ account.getAccount();
		Configure config = new Configure(fileName);
		ConfPeer peer = new ConfPeer(account.getAccount());
		if (account.getInvestigateMusic() != null)
			peer.addParam(Fields.Investigate, account.getInvestigateMusic());
		if (account.getName() != null)
			peer.addParam(Fields.Name, account.getName());
		if (account.getPhonebarConfig() != null)
			peer.addParam(Fields.PhonebarConfigKey, account.getPhonebarConfig().getValueString());
			
		peer.addParam(Fields.MaxIncomingCalls, account.getLisence().getMaxIncomingCalls()+"");
		peer.addParam(Fields.MaxOutboundCalls, account.getLisence().getMaxOutboundCalls()+"");
		peer.addParam(Fields.VersionOutCall, account.getLisence().getOutCallCount()+"");
		peer.addParam(Fields.VersionOutcallSpecial, account.getLisence().getOutCallSpecialCount()+"");
		peer.addParam(Fields.VersionService, account.getLisence().getServiceCount()+"");
		peer.addParam(Fields.VersionEnterprise, account.getLisence().getEnterpriseCount()+"");
		peer.addParam(Fields.VersionMonitor, account.getLisence().getMonitorCount()+"");
		peer.addParam(Fields.VersionOrder, account.getLisence().getOrderCount()+"");
		peer.addParam(Fields.VersionIVR, account.getLisence().getIvrCount()+"");
		peer.addParam(Fields.VersionStandard, account.getLisence().getStandardCount()+"");
		peer.addParam(Fields.VersionBusiness, account.getLisence().getBusinessCount()+"");
		peer.addParam(Fields.Dialoutable, account.getLisence().isCanDialout()+"");
		peer.addParam(Fields.Callable400, account.getLisence().isCallable400()+"");
		peer.addParam(Fields.AutoCallStrategy, account.getLisence().getAutoCallStrategy()+"");
		peer.addParam(Fields.SmartAutoCallCount, account.getLisence().getSmartAutoCallCount()+"");
		
		config.addPeer(peer);

		// Aman zhai. 2010.05.10
		ConfPeer peerExten = new ConfPeer(Fields.ExtenFields);
		if (account.getExtenFields() != null) {
			Hashtable<String, Object> extenFields = account.getExtenFields()
					.getParameters();
			if (null != extenFields) {
				Iterator<String> iterator = extenFields.keySet().iterator();
				while (iterator.hasNext()) {
					String key = iterator.next();
					peerExten.addParam(key, extenFields.get(key).toString());
				}
			}
		}
		config.addPeer(peerExten);
		// <--

		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void updateSatisfaction(String pbx, String account,
			Hashtable<String, Satisfaction> satisfactions) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + SATISFACTION;
		Configure config = new Configure(fileName);
		
		Iterator<Satisfaction> bls = satisfactions.values().iterator();
		while (bls.hasNext()) {
			Satisfaction ivr = bls.next();
			ConfPeer peer = new ConfPeer(ivr.getExten());
			if (ivr.getToPeer() != null)
				peer.addParam(Fields.ToPeer, ivr.getToPeer());
			if (ivr.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, ivr.getDisplayName());
			
			if (ivr.getData() != null)
				peer.addParam(Fields.Data, ivr.getData());
			
			if (ivr.getWelmusic() != null)
				peer.addParam(Fields.Welfilename, ivr.getWelmusic().getMusicFile());
			
			if (ivr.getInvalidmusic() != null)
				peer.addParam(Fields.Invalidfilename, ivr.getInvalidmusic().getMusicFile());
			
			if (ivr.getTimeoutmusic() != null)
				peer.addParam(Fields.Timeoutfilename, ivr.getTimeoutmusic().getMusicFile());
			
			if (ivr.getByemusic() != null)
				peer.addParam(Fields.Byefilename, ivr.getByemusic().getMusicFile());
			
			if (ivr.getEndmusic() != null)
				peer.addParam(Fields.Endfilename, ivr.getEndmusic().getMusicFile());
			
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void updateSuperDialJobNum(String pbx, String account,
			Hashtable<String, SuperDialJobNum> superDialJobNums) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + SUPERDIALJOBNUM;
		Configure config = new Configure(fileName);
		
		Iterator<SuperDialJobNum> bls = superDialJobNums.values().iterator();
		while (bls.hasNext()) {
			SuperDialJobNum ivr = bls.next();
			ConfPeer peer = new ConfPeer(ivr.getExten());
			if (ivr.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, ivr.getDisplayName());
			
			if (ivr.getMusic() != null)
				peer.addParam(Fields.Filename, ivr.getMusic().getMusicFile());
			
			peer.addParam(Fields.ToPeer, ivr.getToPeerNotExist());
			peer.addParam(Fields.AgentBusyToPeer, ivr.getToPeerAgentBusy());
			peer.addParam(Fields.LogoffToPeer, ivr.getToPeerLogoff());
			peer.addParam(Fields.FrontOfficeToPeer, ivr.getToPeerFrontOffice());

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void updateAnnouncement(String pbx, String account,
			Hashtable<String, Announcement> announcements) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + ANNOUNCEMENT;
		Configure config = new Configure(fileName);
		Iterator<Announcement> bls = announcements.values().iterator();
		while (bls.hasNext()) {
			Announcement ivr = bls.next();
			ConfPeer peer = new ConfPeer(ivr.getExten());
			if (ivr.getMusic() != null)
				peer.addParam(Fields.Filename, ivr.getMusic().getMusicFile());
			if (ivr.getToPeer() != null)
				peer.addParam(Fields.ToPeer, ivr.getToPeer());
			if (ivr.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, ivr.getDisplayName());
			if (ivr.getNotbreak() != null)
				peer.addParam(Fields.NotBreak, ivr.getNotbreak());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void updateSwitchBoard(String pbx, String account,
			Hashtable<String, SwitchBoard> switchBoards) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + SWITCH_BOARD;
		Configure config = new Configure(fileName);
		Iterator<SwitchBoard> switchBoardIte = switchBoards.values().iterator();
		while (switchBoardIte.hasNext()) {
			SwitchBoard switchBoard = switchBoardIte.next();
			ConfPeer peer = new ConfPeer(switchBoard.getExten());
			if (switchBoard.getMusic() != null)
				peer.addParam(Fields.Filename, switchBoard.getMusic().getMusicFile());
			if (switchBoard.getQueue() != null)
				peer.addParam(Fields.Queue, switchBoard.getQueue());
			if (switchBoard.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, switchBoard.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		
	}
	
	public static void updateIvrMenu(String pbx, String account,
			Hashtable<String, IvrMenu> ivrMenus) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + IVRMENU;
		Configure config = new Configure(fileName);
		
		Iterator<IvrMenu> bls = ivrMenus.values().iterator();
		while (bls.hasNext()) {
			IvrMenu ivr = bls.next();
			ConfPeer peer = new ConfPeer(ivr.getExten());
			if (ivr.getToPeer() != null)
				peer.addParam(Fields.ToPeer, ivr.getToPeer());
			if (ivr.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, ivr.getDisplayName());
			if (ivr.getMenuType() != null)
				peer.addParam(Fields.MenuType, ivr.getMenuType());
			if (ivr.getMenuOutNum() != null)
				peer.addParam(Fields.MenuOutNum, ivr.getMenuOutNum());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void updateValidate(String pbx, String account,
			Hashtable<String, Validation> validations) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + VALIDATE;
		Configure config = new Configure(fileName);
		Iterator<Validation> bls = validations.values().iterator();
		while (bls.hasNext()) {
			Validation ivr = bls.next();
			ConfPeer peer = new ConfPeer(ivr.getExten());
			if (ivr.getMusic() != null)
				peer.addParam(Fields.Filename, ivr.getMusic().getMusicFile());
			if (ivr.getNextPeer() != null)
				peer.addParam(Fields.ToPeer, ivr.getNextPeer());
			if (null != ivr.getReturnKey())
				peer.addParam(Fields.ReturnKey, ivr.getReturnKey());
			if (null != ivr.getNextPeerWhenTimeout())
				peer.addParam(Fields.ToPeerWhenWaitTimeout, ivr
						.getNextPeerWhenTimeout());
			if (null != ivr.getDisplayName())
				peer.addParam(Fields.DisplayName, ivr.getDisplayName());
			peer.addParam(Fields.Data, ivr.getData());
			peer.addParam(Fields.WaitTime, ivr.getWaitTimeout() + "");
			int endType = ivr.getEndType();
			peer.addParam(Fields.EndType, endType + "");
			if (Validation.END_LENGTH == endType) {
				peer.addParam(Fields.EndLength, ivr.getEndLength() + "");
			} else if (Validation.END_CHAR == endType) {
				peer.addParam(Fields.Max, ivr.getMaxLength() + "");
			}
			peer.addParam(Fields.Min, ivr.getMinLength() + "");
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void updateVoicemail(String pbx, String account,
			Hashtable<String, Voicemail> vms) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + VOICEMAIL;
		Configure config = new Configure(fileName);
		Iterator<Voicemail> bls = vms.values().iterator();
		while (bls.hasNext()) {
			Voicemail voicemail = bls.next();
			ConfPeer peer = new ConfPeer(voicemail.getExten());
			if (voicemail.getWelcomeMusic() != null)
				peer.addParam(Fields.Filename, voicemail.getWelcomeMusic()
						.getMusicFile());
			if (voicemail.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, voicemail.getDisplayName());
			if(voicemail.getToPeer() != null)
				peer.addParam(Fields.ToPeer, voicemail.getToPeer());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void updateExtensionPeer(String pbx, String account,
			Hashtable<String, ExtensionPeer> eps) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + EXTENSION_PEER;
		Configure config = new Configure(fileName);
		Iterator<ExtensionPeer> bls = eps.values().iterator();
		while (bls.hasNext()) {
			ExtensionPeer epeer = bls.next();
			ConfPeer peer = new ConfPeer(epeer.getExten());
			JSONWriter jw = new JSONWriter();
			peer.addParam(Fields.DialPlan, jw.write(epeer.getDialplan()));
			if (epeer.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, epeer.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void updateDialoutLine(String pbx, String account,
			DialLine line) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + DIALOUT_LINE;
		Configure config = new Configure(fileName);
		ConfPeer peer = new ConfPeer(line.getExten());
		peer.addParam(Fields.DidNum, line.getDidNum());
		peer.addParam(Fields.NeedPrefix, line.isNeedPrefix() ? "yes" : "no");
		peer.addParam(Fields.Dialout, line.isDialout() ? "yes" : "no");
		if (line.getDisplayName() != null)
			peer.addParam(Fields.DisplayName, line.getDisplayName());
		peer.addParam(Fields.MultiDidEnable, line.isMultiDidEnable() ? "yes" : "no");
		if (line.getMultiDidNum() != null)
			peer.addParam(Fields.MultiDidNum, line.getMultiDidNum());
		if (line.getMultiDidStrategy() != null)
			peer.addParam(Fields.MultiDidStrategy, line.getMultiDidStrategy());
		if (line.getMultiDidScope() != null)
			peer.addParam(Fields.MultiDidScope, line.getMultiDidScope());
		
		config.addPeer(peer);
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void updateXferLine(String pbx, String account, DialLine line)
			throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + XFER_LINE;
		Configure config = new Configure(fileName);
		ConfPeer peer = new ConfPeer(line.getExten());
		peer.addParam(Fields.DidNum, line.getDidNum());
		peer.addParam(Fields.NeedPrefix, line.isNeedPrefix() ? "yes" : "no");
		peer.addParam(Fields.Dialout, line.isDialout() ? "yes" : "no");
		if (line.getDisplayName() != null)
			peer.addParam(Fields.DisplayName, line.getDisplayName());
		config.addPeer(peer);
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	// Aman zhai. 2010.05.11
	public static void updateEventInterfaces(String pbx, String account,
			Hashtable<String, Hashtable<String, EventInterface>> eventInterfaces)
			throws Exception {
		String fileName = EVENT_INTERFACES;
		Configure config = new Configure(fileName);

		Iterator<String> iterator = eventInterfaces.keySet().iterator();
		while (iterator.hasNext()) {
			String key = iterator.next();
			Hashtable<String, EventInterface> value = eventInterfaces.get(key);
			ConfPeer peer = new ConfPeer(key);
			Iterator<String> valIterator = value.keySet().iterator();
			while (valIterator.hasNext()) {
				String valKey = valIterator.next();
				String leftKey = valKey + "."
						+ value.get(valKey).getConcreteType();
				peer.addParam(leftKey, value.get(valKey).getUrl());
				peer.addParam(Fields.PBX, value.get(valKey).getPbx());
			}
			config.addPeer(peer);
		}
		try {
			ConfParser.saveConf(config, cp.getWriteCharset());
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static Hashtable<String, Hashtable<String, EventInterface>> loadEventInterfaces() {
		Hashtable<String, Hashtable<String, EventInterface>> eventInterfaces = new Hashtable<String, Hashtable<String, EventInterface>>();
		try {
			Configure conf = ConfParser.parser(EVENT_INTERFACES, cp
					.getReadCharset());
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					Hashtable<String, EventInterface> eventInterface = new Hashtable<String, EventInterface>();

					String pbx = p.getParam(Fields.PBX);
					Hashtable<String, String> pHash = p.getParams();
					Iterator<String> iterator = pHash.keySet().iterator();
					while (iterator.hasNext()) {
						String key = iterator.next();
						EventInterface ei = new EventInterface(pbx, p.getName());
						if (!key.equalsIgnoreCase(Fields.PBX)) {
							String[] splitLine = key.split("\\.");
							ei.setKey(splitLine[0]);
							ei.setConcreteType(splitLine[1]);
							ei.setUrl(pHash.get(key));
							eventInterface.put(ei.getKey(), ei);
						}
					}

					eventInterfaces.put(p.getName(), eventInterface);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		// account.setEventInterfaces(eventInterfaces);
		return eventInterfaces;
	}
	
	public static boolean updateAutoCallTask(String pbx, String account,
			Hashtable<String, AutoCallTask> autoCallTasks) throws Exception {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + AUTO_CALL_TASK;
		Configure config = new Configure(fileName);
		Iterator<AutoCallTask> bls = autoCallTasks.values().iterator();
		while (bls.hasNext()) {
			AutoCallTask task = bls.next();
			ConfPeer peer = new ConfPeer(task.getTaskId());			
			
			peer.addParam(Fields.TaskId, task.getTaskId());
				
			if (task.getDisplayName() != null)
				peer.addParam(Fields.autoCallTask_displayName, task.getDisplayName());
			if (task.getTaskType() != null)
				peer.addParam(Fields.TaskType, task.getTaskType());
			if (task.getNumType() != null)
				peer.addParam(Fields.NumType, task.getNumType());
			if (task.getServiceNo() != null)
				peer.addParam(Fields.autoCallTask_serviceNo, task.getServiceNo());
			if (task.getTimeType() != null) 
				peer.addParam(Fields.TimeType, task.getTimeType());
			if (task.getTaskDate() != null)
				peer.addParam(Fields.TaskDate, task.getTaskDate());
			if (task.getTaskTime() != null)
				peer.addParam(Fields.TaskTime, task.getTaskTime());
			if (task.getTaskQueue() != null)
				peer.addParam(Fields.TaskQueue, task.getTaskQueue());
			peer.addParam(Fields.Start, task.isStart()+"");

			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static Hashtable<String, AutoCallTask> loadAutoCallTasks(C5Account account) {
		Hashtable<String, AutoCallTask> autoCallTasks = new Hashtable<String, AutoCallTask>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + AUTO_CALL_TASK);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					AutoCallTask task = new AutoCallTask(account.getPbx(), account
							.getAccount(), p.getName());
					task.setValues(p.getParams());

					autoCallTasks.put(task.getTaskId(), task);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setAutoCallTasks(autoCallTasks);
		return autoCallTasks;
	}

	public static boolean updateMailQueue(String account, String pbx,
			Hashtable<String, MailQueue> mqueues) {
		File file = new File(ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + MAIL_QUEUE);
		if (!file.exists())
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create mail_queue.conf file failed", e);
				return false;
			}
		String data = "";
		Iterator<MailQueue> _queues = mqueues.values().iterator();
		while (_queues.hasNext()) {
			MailQueue mqueue = _queues.next();
			data += mqueue.getConfigString();
			data += "\r\n";
		}
		try {
			Writer fw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file), "UTF-8"));
			fw.write(data);
			fw.flush();
			fw.close();
		} catch (IOException e) {
			log.log(Level.WARNING, "Write mail_queue.conf file failed", e);
			return false;
		}
		return true;
	}

	
	public static Hashtable<String, MailQueue> loadMailQueue(C5Account account) {
		Hashtable<String, MailQueue> mqueues = new Hashtable<String, MailQueue>();
		try {
			File file = new File(ASConfig.getInstance().getConfigPath() + "/"
					+ account.getPbx() + "/accounts/" + account.getAccount()
					+ "/conf/" + MAIL_QUEUE);
			if (file.exists()) {
				BufferedReader br = new BufferedReader(new InputStreamReader
						(new FileInputStream(file), "UTF-8"));
				String line = null;
				MailQueue mqueue = null;
				while ((line = br.readLine()) != null) {
					if (line.startsWith("[")) {
						String exten = line.substring(1, line.length() - 1);
						mqueue = new MailQueue(account.getPbx(), account
								.getAccount(), exten);
						mqueues.put(exten, mqueue);
					} else if (line.startsWith(C5Queue.STRATEGY)) {
						String[] a = line.split("=");
						if (mqueue != null)
							mqueue.setStrategy(a[1].trim());
					} else if (line.startsWith(C5Queue.DISPLAY_NAME)) {
						String[] a = line.split("=");
						if (mqueue != null)
							mqueue.setDisplayName(a[1].trim());
					} else if (line
							.startsWith(C5Queue.TO_PEER_WHEN_QUEUE_EMPTY)) {
						String[] a = line.split("=");
						if (mqueue != null) {
							mqueue.setToPeerWhenQueueEmpty(a[1].trim());
						}
					} else if (line.startsWith(Fields.Members)) {
						String[] a = line.split("=");
						if (mqueue != null) {
							String[] b = a[1].trim().split(",");
							for (int i = 0; i < b.length; i++) {
								String name = b[i];
								String penalty = "0";
								if (b[i].indexOf(':') != -1) {
									String[] c = b[i].split(":");
									name = c[0];
									penalty = c[1];
								}
								mqueue.addMember(name, penalty);
							}
						}
					} else if (line.startsWith(C5Queue.JOIN_EMPTY)) {
						String[] a = line.split("=");
						if (mqueue != null) {
							String joinEmpty = a[1].trim();
							if (joinEmpty.equalsIgnoreCase("strict")) {
								mqueue.setJoinEmpty(true);
							} else {
								mqueue.setJoinEmpty(false);
							}
						}
					} else if (line.startsWith(C5Queue.TIMEOUT)) {
						String[] a = line.split("=");
						if (mqueue != null)
							mqueue.setTimeout(Integer.valueOf(a[1].trim()));
					} else if (line.startsWith(Fields.WaitCount)) {
						String[] a = line.split("=");
						if (mqueue != null)
							mqueue.setWaitCount(Integer.valueOf(a[1].trim()));
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		account.setMailQueues(mqueues);
		return mqueues;
	}
	
	public static boolean updateMailAddr(String pbx, String account,
			Hashtable<String, MailAddr> mas) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + MAIL_ADDR;

		Configure config = new Configure(fileName);
		Iterator<MailAddr> mailAddrs = mas.values().iterator();
		while (mailAddrs.hasNext()) {
			MailAddr ma = mailAddrs.next();
			ConfPeer peer = new ConfPeer(ma.getExten());
			if (ma.getToPeer() != null)
				peer.addParam(Fields.ToPeer, ma.getToPeer());
			if (ma.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, ma.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	
	public static Hashtable<String, MailAddr> loadMailAddr(C5Account account) {
		Hashtable<String, MailAddr> mas = new Hashtable<String, MailAddr>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + MAIL_ADDR);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					MailAddr ma = new MailAddr(account.getPbx(), account
							.getAccount(), p.getName());
					ma.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						ma.setDisplayName(p.getParam(Fields.DisplayName));
					mas.put(ma.getExten(), ma);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setMailAddrs(mas);
		return mas;
	}
	
	public static boolean updateWeixinAddr(String pbx, String account,
			Hashtable<String, WeixinAddr> was) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + WEIXIN_ADDR;

		Configure config = new Configure(fileName);
		Iterator<WeixinAddr> weixinAddrs = was.values().iterator();
		while (weixinAddrs.hasNext()) {
			WeixinAddr wa = weixinAddrs.next();
			ConfPeer peer = new ConfPeer(wa.getExten());
			if (wa.getToPeer() != null)
				peer.addParam(Fields.ToPeer, wa.getToPeer());
			if (wa.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, wa.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static Hashtable<String, WeixinAddr> loadWeixinAddr(C5Account account) {
		Hashtable<String, WeixinAddr> was = new Hashtable<String, WeixinAddr>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + WEIXIN_ADDR);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					WeixinAddr wa = new WeixinAddr(account.getPbx(), account
							.getAccount(), p.getName());
					wa.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						wa.setDisplayName(p.getParam(Fields.DisplayName));
					was.put(wa.getExten(), wa);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setWeixinAddrs(was);
		return was;
	}
	
	public static boolean updateWebchatAddr(String pbx, String account,
			Hashtable<String, WebchatAddr> wcs) {
		String fileName = ASConfig.getInstance().getConfigPath() + "/" + pbx
				+ "/accounts/" + account + "/conf/" + WEBCHAT_ADDR;

		Configure config = new Configure(fileName);
		Iterator<WebchatAddr> webchatAddrs = wcs.values().iterator();
		while (webchatAddrs.hasNext()) {
			WebchatAddr wc = webchatAddrs.next();
			ConfPeer peer = new ConfPeer(wc.getExten());
			if (wc.getToPeer() != null)
				peer.addParam(Fields.ToPeer, wc.getToPeer());
			if (wc.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, wc.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
	public static Hashtable<String, WebchatAddr> loadWebchatAddr(C5Account account) {
		Hashtable<String, WebchatAddr> wcs = new Hashtable<String, WebchatAddr>();
		try {
			Configure conf = cp.parser(ASConfig.getInstance().getConfigPath()
					+ "/" + account.getPbx() + "/accounts/"
					+ account.getAccount() + "/conf/" + WEBCHAT_ADDR);
			ConfPeer[] peers = conf.getAllPeers();
			if (peers != null && peers.length > 0) {
				for (int i = 0; i < peers.length; i++) {
					ConfPeer p = peers[i];
					WebchatAddr wc = new WebchatAddr(account.getPbx(), account
							.getAccount(), p.getName());
					wc.setValue(p.getParams());
					if (p.contain(Fields.DisplayName))
						wc.setDisplayName(p.getParam(Fields.DisplayName));
					wcs.put(wc.getExten(), wc);
				}
			}
		} catch (ConfigureParserException e) {
			// log.log(Level.WARNING, "", e);
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
		}
		account.setWebchatAddrs(wcs);
		return wcs;
	}
}
