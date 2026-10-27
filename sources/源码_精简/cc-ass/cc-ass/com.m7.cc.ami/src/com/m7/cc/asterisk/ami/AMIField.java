package com.m7.cc.asterisk.ami;

/**
 * 
 * @author caizhibin 2009-6-10
 *
 */
public class AMIField {
	
	
	//ice extension conf field
	public static final String ICE_VOICEMAIL = "ice-voicemail";
	public static final String ICE_MOD = "ice-mod";
	public static final String ICE_VOICEMAIL_MAIN = "ice-voicemailmain";
	public static final String ICE_CHANNEL_SPY = "ice-channelspy";
	
	public static final String SetVar = "SetVar";
	public static final String ADD = "Add";
	public static final String MODIFY = "Modify";
	public static final String REMOVE = "Remove";
	public static final String QUERY = "Query";
	
    public static final String END_ACTION = "\r\n";
    public static final String END_LINE = "\r\n";
    public static final String SPLIT = ":";
    
    public static final String LOG_LEVEL = "log.level";
    public static final String LOG_CONSOLE = "log.console";
    
    public static final String PORT = "port";
    public static final String HOST = "host";
    public static final String ADMIN = "admin";
    public static final String CODEC = "codec";
    public static final String VOICEMAIL = "voicemail";
    public static final String MOBILE = "mobile";
    public static final String EMAIL = "email";
    public static final String SIP = "SIP";
    public static final String ZAP = "ZAP";
    public static final String ONLINE = "Online";
    public static final String OFFLINE = "Offline";
    public static final String NULL = "null";
    public static final String UNKNOWN = "<unknown>";
    public static final String MONITOR_FILENAME = "MonitorFilename";
    //applications
    public static final String VOICE_MAIL_APP = "VoiceMail";
    public static final String CHAN_SPY_APP = "ChanSpy";
    public static final String ANSWER_APP = "Answer";
    public static final String VOICE_MAIL_MAIN = "VoiceMailMain";
   
	//action names
    public static final String PING = "Ping";
	public static final String LOGIN = "Login";
	public static final String LOGOFF = "Logoff";
	public static final String CHALLENGE = "Challenge";
	public static final String ORIGINATE = "Originate";
	public static final String COMMAND = "Command";
	public static final String EXTENSION_STATE = "ExtensionState";
	public static final String EXTENSION_STATUS = "ExtensionStatus";
	public static final String PARK = "Park";
	public static final String PARKED_CALLS = "ParkedCalls";
	public static final String STATUS = "Status";
	public static final String SIP_PEERS = "SIPPeers";
	public static final String ZAP_SHOW_CHANNELS = "ZapShowChannels";
	public static final String AGENTS = "Agents";
	public static final String AGENT_CALLBACK_LOGIN = "AgentCallbackLogin";
	public static final String AGENT_LOGOFF = "AgentLogoff";
	public static final String QUEUE_ADD = "QueueAdd";
	public static final String QUEUE_STATUS = "QueueStatus";
	public static final String QUEUE_PAUSE = "QueuePause";
	public static final String QUEUE_REMOVE = "QueueRemove";
	public static final String REDIRECT = "Redirect";
	public static final String MAILBOX_COUNT = "MailboxCount";
	public static final String MONITOR = "Monitor";
	public static final String STOP_MONITOR = "StopMonitor";
	public static final String PLAY_DTMF = "PlayDTMF";
	public static final String GET_CONFIG = "GetConfig";
	public static final String UPDATE_CONFIG = "UpdateConfig";
	public static final String SIP_SHOW_PEER = "SIPShowPeer";
	
	//return from asterisk
	public static final String REGISTERED = "Registered";
	public static final String UNREGISTERED = "Unregistered";
	public static final String NOT_FOUND = "NotFound";
	public static final String NOT_HINT = "NotHint";
	public static final String UNKNOW = "Unknow";
	public static final String REACHABLE = "Reachable";
	public static final String UNREACHABLE = "Unreachable";
	
	//queue add
	public static final String INTERFACE = "Interface";
	public static final String MEMBER_NAME = "MemberName";
	public static final String PENALTY = "Penalty";
	public static final String PAUSED = "Paused";
	public static final String LOCAL = "Local";
	public static final String REMOVED = "Removed";
	public static final String LEFT = "Left";
	public static final String UNIQUEID = "Uniqueid";
	public static final String UNIQUEID1 = "Uniqueid1";
	public static final String UNIQUEID2 = "Uniqueid2";
	public static final String TIMESTAMP = "Timestamp";
	public static final String SrcUniqueID = "SrcUniqueID";
	public static final String DestUniqueID = "DestUniqueID";
	//park call
	
	public static final String MAILBOX = "Mailbox";
	public static final String EXTRA_CHANNEL = "ExtraChannel";
	public static final String SOFT = "Soft";
	public static final String WRAPUP_TIME = "WrapupTime";
	public static final String AGENT = "Agent";
	public static final String FROM = "From";
	public static final String PARKED = "Parked";
	public static final String MEMBER = "Member";
	public static final String ACTION_ID = "ActionID";
	public static final String ACTION = "Action";
	public static final String USER_NAME = "UserName";
	public static final String SECRET = "Secret";
	public static final String NEGATIVE = "Negative";
	public static final String KEY = "Key";
	public static final String AUTH_TYPE = "AuthType";
	public static final String DIGIT = "Digit";
	public static final String CHANNEL = "Channel";
	public static final String CHANNEL1 = "Channel1";
	public static final String CHANNEL2 = "Channel2";
	public static final String EXTEN = "Exten";
	public static final String PEER = "Peer";
	public static final String CONTEXT = "Context";
	public static final String GROUP = "Group";
	public static final String PRIORITY = "Priority";
	public static final String APPLICATION = "Application";
	public static final String DATA = "Data";
	public static final String TIMEOUT = "Timeout";
	public static final String CALLERID = "CallerID";
	public static final String CALLERID1 = "CallerID1";
	public static final String CALLERID2 = "CallerID2";
	public static final String CALLERIDNUM = "CallerIDNum";
	public static final String CALLERIDNAME = "CallerIDName";
	public static final String CALLERIDNUM1 = "CallerIDNum1";
	public static final String CALLERIDNAME1 = "CallerIDName1";
	public static final String VARIABLE = "Variable";
	public static final String Value = "Value";
	public static final String ASYNC = "Async";
	public static final String STATE = "State";
	public static final String FORMAT = "Format";
	public static final String FILE = "File";
	public static final String FILENAME = "Filename";
	public static final String MIX = "Mix";
	
	public static final String AgentCalled = "AgentCalled";
	public static final String AgentConnect = "AgentConnect";
	public static final String AgentComplete = "AgentComplete";
	
	//event name
	public static final String EVENT = "Event";
	public static final String CHANNEL_TYPE = "Channeltype";
	public static final String OBJECT_NAME = "ObjectName";
	public static final String CHAN_OBJECT_TYPE = "ChanObjectType";
	public static final String ACL = "ACL";
	public static final String IP_PORT = "IPport";
	public static final String IP_ADDRESS = "IPaddress";
	public static final String NAT_SUPPORT = "Natsupport";
	public static final String REALTIME_DEVICE = "RealtimeDevice";
	public static final String VIDEO_SUPPORT = "VideoSupport";
	public static final String PEER_ENTRY = "PeerEntry";
	public static final String PRIVILEGE = "Privilege";
	public static final String RELOAD = "Reload";
	public static final String SrcFilename = "SrcFilename";
	public static final String DstFilename = "DstFilename";
	public static final String PEER_STATUS = "PeerStatus";
	public static final String NEW_STATUS = "Newstate";
	public static final String NEW_EXTEN = "Newexten";
	public static final String CHANNEL_STATUS = "ChannelStatus";
	public static final String NEW_CHANNEL = "Newchannel";
	public static final String HANGUP = "Hangup";
	public static final String UNLINK = "Unlink";
	public static final String LINK = "Link";
	public static final String PARKED_CALL = "ParkedCall";
	public static final String UNPARKED_CALL = "UnParkedCall";
	public static final String PARKED_CALL_TIEMOUT = "ParkedCallTimeOut";
	public static final String PARKED_CALL_GIVE_UP = "ParkedCallGiveUp";
	public static final String QUEUE_MEMBER = "QueueMember";
	public static final String QUEUE_ENTRY = "QueueEntry";
	public static final String MESSAGE_WAITING = "MessageWaiting";
	public static final String NEW_CALLERID = "Newcallerid";
	public static final String DIAL = "Dial";
	public static final String QUEUE_MEMBER_STATUS = "QueueMemberStatus";
	
	public static final String DESTINATION = "Destination";
	public static final String SOURCE = "Source";
	public static final String ChannelCalling = "ChannelCalling";
	public static final String AgentName = "AgentName";
	
	public static final String APP_DATA = "AppData";
	public static final String Set = "Set";
	
	//event queueMember
	public static final String QUEUE = "Queue";
	public static final String LOCATION = "Location";
	public static final String MEMBERSHIP = "Membership";
	public static final String CALLS_TAKEN = "CallsTaken";
	public static final String LAST_CALL = "LastCall";
	public static final String STATIC = "Static";
	public static final String DYNAMIC = "Dynamic";
	public static final String NAME = "Name";
	
	//event queueEntry
	public static final String POSITION = "Position";
	public static final String WAIT = "Wait";
	
	//event queueParams
	public static final String QUEUE_PARAMS = "QueueParams";
	public static final String MAX = "Max";
	public static final String CALLS = "Calls";
	public static final String HOLDTIME = "Holdtime";
	public static final String COMPLETED = "Completed";
	public static final String ABANDONED = "Abandoned";
	public static final String SERVICE_LEVEL = "ServiceLevel";
	public static final String SERVICELEVEL_PERF = "ServicelevelPerf";
	public static final String WEIGHT = "Weight";
	
	public static final String PEERLIST_COMPLETE = "PeerlistComplete";
	public static final String ListItems = "ListItems";
	public static final String QUEUE_STATUS_COMPLETE = "QueueStatusComplete";
	
	//event queue member added
	public static final String QUEUE_MEMBER_ADDED = "QueueMemberAdded";
	
	//event queue member removed
	public static final String QUEUE_MEMBER_REMOVED = "QueueMemberRemoved";
	
	//event queue member paused
	public static final String QUEUE_MEMBER_PAUSED = "QueueMemberPaused";
	
	//event join
	public static final String JOIN = "Join";
	public static final String COUNT = "Count";
	
	//event leave
	public static final String LEAVE = "Leave";
	
	//event queue caller abandon
	public static final String QUEUE_CALLER_ABANDON = "QueueCallerAbandon";
	public static final String ORIGINAL_POSITION = "OriginalPosition";
	
	
	//response
	public static final String RESPONSE = "Response";
	public static final String PONG = "Pong";
	public static final String FAILED = "Failed";
	public static final String SUCCESS = "Success";
	public static final String FOLLOWS = "Follows";
	public static final String MESSAGE = "Message";
	
	//response ExtensionStatus
	public static final String HINT = "Hint";
	public static final String EXTENSION_SPACE_STATUS = "Extension Status";
	
	//respons Mailbox Message Count
	public static final String MAILBOX_SPACE_MESSAGE_SPACE_COUNT = "Mailbox Message Count";
	public static final String NEW_MESSAGES = "NewMessages";
	public static final String OLD_MESSAGES = "OldMessages";
	
	//register result
	public static final int REGISTER_FAILED = 0;
	public static final int REGISTER_SUCCESS = 1;
	public static final int REGISTER_UNKNOW_HOST = 2;
	public static final int REGISTER_CONNECT_FAILED = 3;
	public static final int REGISTER_SERVER_NOT_READY = 4;
	
	public static final String FROM_EXTEN = "FromExten";
	public static final String TO_EXTEN = "ToExten";
	public static final String MESSAGES = "Messages";
	public static final String TIME = "Time";
	public static final String TEMP_UNVALAIBLE = "TempUnvalaible";
	public static final String SHUTDOWN = "Shutdown";
	public static final String DND = "DND";
	
	public static final String FROM_CID = "FromCid";
	public static final String FROM_DID = "FromDid";
	public static final String __FROM_CID = "__FROM_CID";
	public static final String __FROM_DID = "__FROM_DID";
	public static final String ACCOUNT = "Account";
//	public static final String 
}	
