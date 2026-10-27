package com.m7.cc.asterisk.ami;

/**
 * 
 * @author Cai Zhibin 2009-7-6
 *
 */
public class C5Constants
{
    // Asterisk configuration files
    public static final String USERS_CONF = "users.conf";
    public static final String EXTENSIONS_CONF = "extensions.conf";
    public static final String MEETME_CONF = "meetme.conf";
    public static final String MANAGER_CONF = "manager.conf";
    public static final String ASTERISK_CONF_DIR = "/etc/asterisk/";
    public static final int ASTERISK_ADMIN_PASS_LEN = 10;

    // Values used in Asterisk configuration files
    // public static final String CONF_NO = "no";
    // public static final String CONF_YES = "yes";

    // This tag defines an action for the server
    public static final String ASTERISK_ACTION_TAG = "ACTION";

    // These tags define delimiters in Asterisk communication
    public static final String ASTERISK_END_ACTION = "\r\n";
    public static final String ASTERISK_END_LINE = "\r\n";
    public static final String VEIL_END_LINE = "\n";

    // The following are masks set up for the event system. Use these masks to define
    // what messages are sent
    public static final int ASTERISK_EVENT_AGENT = 32;
    public static final int ASTERISK_EVENT_ALL = 255;
    public static final int ASTERISK_EVENT_CALL = 4;
    public static final int ASTERISK_EVENT_COMMAND = 16;
    public static final int ASTERISK_EVENT_CONFIG = 128;
    public static final int ASTERISK_EVENT_LOG = 1;
    public static final int ASTERISK_EVENT_OFF = 0;
    public static final int ASTERISK_EVENT_SYSTEM = 2;
    public static final int ASTERISK_EVENT_USER = 64;
    public static final int ASTERISK_EVENT_VERBOSE = 8;

    // The following define different file actions that the Asterisk server can carry out
    public static final int ASTERISK_CONFIG_APPEND = 6;
    public static final int ASTERISK_CONFIG_DEL_CAT = 3;
    public static final int ASTERISK_CONFIG_DELETE = 5;
    public static final int ASTERISK_CONFIG_NEW_CAT = 1;
    public static final int ASTERISK_CONFIG_RENAME_CAT = 2;
    public static final int ASTERISK_CONFIG_UPDATE = 4;

    // The following device the admin authorization capabilities
    public static final int ASTERISK_ADMIN_NONE = 0;
    public static final int ASTERISK_ADMIN_SYSTEM_R = 1;
    public static final int ASTERISK_ADMIN_SYSTEM_W = 2;
    public static final int ASTERISK_ADMIN_CALL_R = 4;
    public static final int ASTERISK_ADMIN_CALL_W = 8;
    public static final int ASTERISK_ADMIN_LOG_R = 16;
    public static final int ASTERISK_ADMIN_LOG_W = 32;
    public static final int ASTERISK_ADMIN_VERBOSE_R = 64;
    public static final int ASTERISK_ADMIN_VERBOSE_W = 128;
    public static final int ASTERISK_ADMIN_COMMAND_R = 256;
    public static final int ASTERISK_ADMIN_COMMAND_W = 512;
    public static final int ASTERISK_ADMIN_AGENT_R = 1024;
    public static final int ASTERISK_ADMIN_AGENT_W = 2048;
    public static final int ASTERISK_ADMIN_USER_R = 4096;
    public static final int ASTERISK_ADMIN_USER_W = 8192;
    public static final int ASTERISK_ADMIN_CONFIG_R = 16384;
    public static final int ASTERISK_ADMIN_CONFIG_W = 32768;
    public static final int ASTERISK_ADMIN_ALL = 65535;

    // General Constants
    public static final String ASTERISK_YES = "yes";
    public static final String ASTERISK_NO = "no";
    public static final String ASTERISK_BLANK = "";
    public static final String ASTERISK_COMMA = ",";
    public static final String ASTERISK_COLON = ":";

    // Users.conf Constants
    public static final String ASTERISK_USER_CALLWAITING = "callwaiting";
    public static final String ASTERISK_USER_CIDNUMBER = "cid_number";
    public static final String ASTERISK_USER_CONTEXT = "context";
    public static final String ASTERISK_USER_EMAIL = "email";
    public static final String ASTERISK_USER_FULLNAME = "fullname";
    public static final String ASTERISK_USER_GROUP = "group";
    public static final String ASTERISK_USER_HASAGENT = "hasagent";
    public static final String ASTERISK_USER_HASDIRECTORY = "hasdirectory";
    public static final String ASTERISK_USER_HASIAX = "hasiax";
    public static final String ASTERISK_USER_HASMANAGER = "hasmanager";
    public static final String ASTERISK_USER_HASSIP = "hassip";
    public static final String ASTERISK_USER_HASVOICEMAIL = "hasvoicemail";
    public static final String ASTERISK_USER_HOST = "host";
    public static final String ASTERISK_USER_MAILBOX = "mailbox";
    public static final String ASTERISK_USER_SECRET = "secret";
    public static final String ASTERISK_USER_THREEWAYCALLING = "threewaycalling";
    public static final String ASTERISK_USER_VMSECRET = "vmsecret";
    public static final String ASTERISK_USER_ZAPCHAN = "zapchan";
    public static final String ASTERISK_USER_DEFAULT_CONTEXT = ASTERISK_BLANK;
    public static final String ASTERISK_USER_HOST_DYNAMIC = "dynamic";

    // Asterisk File System Constants
    public static final String ASTERISK_PATH_VAR = "var";
    public static final String ASTERISK_PATH_SPOOL = "spool";
    public static final String ASTERISK_PATH_ASTERISK = "asterisk";
    public static final String ASTERISK_PATH_VOICEMAIL = "voicemail";
    public static final String ASTERISK_PATH_DEFAULT = "default";

    // Asterisk AMI Action names
    public static final String ASTERISK_AMI_ACT_ORIGINATE = "Originate";

    // Conference Calling constants
    public static final String ASTERISK_MEETME_CAT_ROOMS = "rooms";
    public static final String ASTERISK_MEETME_PREFIX_CONF = "conf";
    public static final String ASTERISK_EXTENS_CAT_CONF_NUMS = "ConferenceNumbers";
    public static final String ASTERISK_EXTENS_PREFIX_EXTEN = "exten";
    public static final String ASTERISK_CONFERENCE_SCRIPT = "bbp-conference.agi";

    // Retry Counts
    public static final int ASTERISK_MAJOR_RETRY = 10;
    public static final int ASTERISK_MINOR_RETRY = 5;

    // Manager.conf constants
    public static final String ASTERISK_ADMIN_SECRET = ASTERISK_USER_SECRET;
    public static final String ASTERISK_ADMIN_PRIV_READ = "read";
    public static final String ASTERISK_ADMIN_PRIV_WRITE = "write";
    public static final String ASTERISK_ADMIN_SYSTEM = "system";
    public static final String ASTERISK_ADMIN_CALL = "call";
    public static final String ASTERISK_ADMIN_LOG = "log";
    public static final String ASTERISK_ADMIN_VERBOSE = "verbose";
    public static final String ASTERISK_ADMIN_COMMAND = "command";
    public static final String ASTERISK_ADMIN_AGENT = "agent";
    public static final String ASTERISK_ADMIN_USER = "user";
    public static final String ASTERISK_ADMIN_CONFIG = "config";

    // Status Constants
    public static final String CHANNEL_DOWN = "Down";
    public static final String CHANNEL_RING = "Ring";
    public static final String CHANNEL_RINGING = "Ringing";
    public static final String CHANNEL_UP = "Up";
    public static final String CHANNEL_BUSY = "Busy";
    public static final String CHANNEL_LINK = "Link";
    public static final String CHANNEL_UNLINK = "Unlink";
    public static final String CHANNEL_HANGUP = "Hangup";
    
    // Status peer states
    final static public int ASTERISK_EXTEN_NOT_FOUND = -2;
    final static public int ASTERISK_EXTEN_NOT_HINT = -1;
    final static public int ASTERISK_PEER_UNREGISTERED = 4;
    final static public int ASTERISK_PEER_REGISTERED = 0;
    final static public int ASTERISK_PEER_BUSY = 1;
    final static public int ASTERISK_PEER_REACHABLE = 2;
    final static public int ASTERISK_EXTEN_UNKNOW = -3;
    final static public int ASTERISK_EXTEN_REMOVED = -100;
    
    //Status extension status
    
    // Status channel states
    final static public int ASTERISK_CHAN_IDLE = 0;
    final static public int ASTERISK_CHAN_CALLING = 1;
    final static public int ASTERISK_CHAN_RINGING = 2;
    final static public int ASTERISK_CHAN_CHATTING = 4;
    final static public int ASTERISK_CHAN_BUSY = 8;

    // Dispatcher constants
    final static public String ASTERISK_DISPATCH_RESPONSE = "Response";
    final static public String ASTERISK_DISPATCH_RESPONSE_W_COL = ASTERISK_DISPATCH_RESPONSE + ASTERISK_COLON;
    final static public String ASTERISK_DISPATCH_EVENT = "Event";
    final static public String ASTERISK_DISPATCH_EVENT_W_COL = ASTERISK_DISPATCH_EVENT + ASTERISK_COLON;
    final static public String ASTERISK_AMI_VERSION = "1.0";
    final static public String ASTERISK_DISPATCH_FIRST_MSG = "Asterisk Call Manager/" + ASTERISK_AMI_VERSION;

}
